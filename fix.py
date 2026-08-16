solution_1.python
import os
import json
import re
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
from boto3.client import client as boto3_client
from langchain_ollama import Ollama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
import pypdf
import python_docx
import pandas as pd

class AttachmentSummarizerService:
    def __init__(self, queue_name: str = "attachment-events", bucket_name: str = "my-attachments-bucket", model: str = "llama2"):
        self.queue_name = queue_name
        self.bucket_name = bucket_name
        self.model = model
        
        # Initialize SQS Client
        self.sqs_client = boto3_client("sqs", region_name=os.getenv("AWS_REGION", "us-east-1"))
        
        # Initialize Ollama Client
        self.ollama = Ollama(base_url=os.getenv("OLLAMA_HOST", "http://localhost:11434"), model=model)
        
        # Prepare Text Splitting and Chain
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        
        prompt = PromptTemplate(
            input_variables=["text"],
            template="Based on the following attachment content, provide a concise, factual summary:\n\n{text}\n\nSummary:"
        )
        self.chain = prompt | self.ollama | StrOutputParser()
        
        # Load specific extractors
        self._load_extractors()

    def _load_extractors(self):
        """Lazy load heavy dependency extractors."""
        self.pdf_reader = pypdf.PDFReader
        self.docx_reader = python_docx.Document
        self.xlsx_reader = lambda df: str(df)

    def fetch_content(self, gcs_key: str) -> str:
        """Downloads file from GCS and extracts text based on file extension."""
        try:
            # Fetch from GCS (S3 Protocol)
            filename = Path(gcs_key).name
            response = self.sqs_client.get_object(Bucket=self.bucket_name, Key=gcs_key)
            body = response["Body"].read()
            body_str = body.decode('utf-8', errors='ignore')
            ext = Path(gcs_key).suffix.lower()
            
            # Specific Logic based on Extension
            if ext == ".pdf":
                # Read PDF stream
                pdf_reader = self.pdf_reader(stream=body)
                text = pdf_reader.extract_text()
                return text or body_str
            elif ext == ".docx":
                # Read DOCX stream
                docx_doc = self.docx_reader(stream=body)
                text = docx_doc.text
                return text or body_str
            elif ext == ".xlsx" or ext == ".csv":
                # Read Spreadsheet
                df = self.xlsx_reader(stream=body)
                return df.to_string() if df is not None else body_str
            elif ext == ".html" or ext == ".txt":
                return body_str
            else:
                # Fallback: just return body
                return body_str
                
        except Exception as e:
            # Fallback for parsing errors
            return f"Raw content parsed: {body_str}"

    def summarize_text(self, text: str) -> str:
        # Limit text length for Ollama context window
        limit = 4000
        if len(text) > limit:
            text = text[:limit] + "..."
        return self.chain.invoke({"text": text})

    def process_message(self, message_body: Dict[str, Any]) -> Dict[str, Any]:
        """Takes an SQS message body and returns the processed result."""
        gcs_key = message_body.get("gcs_key") or message_body.get("key", "default_file.txt")
        filename = message_body.get("filename", Path(gcs_key).name)
        
        extracted = self.fetch_content(gcs_key)
        summary = self.summarize_text(extracted)
        
        # Construct output payload
        result = {
            "filename": filename,
            "summary": summary,
            "processed_at": datetime.now().isoformat(),
            "raw_length": len(extracted),
            "summary_length": len(summary)
        }
        
        return result

    def consume(self):
        """Infinite loop to consume SQS messages."""
        while True:
            response = self.sqs_client.receive_message(
                QueueName=self.queue_name,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=5,
                AttributeNames=["All"]
            )
            
            if response.get("Messages"):
                message = response["Messages"][0]
                body = json.loads(message["Body"])
                
                try:
                    result = self.process_message(body)
                    
                    # Send response back to SQS for further processing or just log
                    # For this bounty, logging result is key
                    print(f"[SQS-Event] Processed: {result['filename']}")
                    print(f"[SQS-Event] Summary: {result['summary'][:100]}...")
                    
                except Exception as e:
                    print(f"[SQS-Event] Error processing {body}: {str(e)}")

                    # Dead letter queue logic could go here
            # Clear messages if batch processing
            self.sqs_client.delete_message(
                QueueName=self.queue_name,
                ReceiptHandle=message["ReceiptHandle"]
            )

if __name__ == "__main__":
    # Configuration
    SQS_URL = os.getenv("SQS_QUEUE_URL", "sqs://my-queue")
    
    service = AttachmentSummarizerService(queue_name=SQS_URL, model="llama2")
    
    # Start consumption
    service.consume()