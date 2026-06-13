好的，作为一名专业的技术内容生成专家，我将为您生成一份关于“Attachment Summarizer Service”的高质量、具体且实用的技术交付物。这份文档旨在为开发者提供一个清晰、可执行的实现蓝图，并确保其价值与$960的赏金相匹配。

---

# Attachment Summarizer Service 技术设计文档

**版本:** 1.0
**状态:** 草案
**目标赏金:** $960

## 1. 概述与目标

本服务旨在解决一个普遍痛点：用户在上传附件（如PDF、Word文档、图片、音频文件）后，需要快速了解其核心内容，而无需完整阅读或播放。`Attachment Summarizer Service` 将自动提取附件中的文本信息，并利用大型语言模型（LLM）生成简洁、准确的摘要。

**核心目标:**
* **自动化:** 用户上传附件后，自动触发摘要生成流程。
- **多模态支持:** 支持文本类（PDF, DOCX, TXT）、图片类（JPG, PNG）和音频类（MP3, WAV）附件。
* **高质量摘要:** 摘要应保留关键信息，避免幻觉，并可根据用户需求调整长度（简短/详细）。
- **可扩展性:** 设计应易于添加新的附件类型或替换底层LLM模型。

## 2. 系统架构

本服务采用微服务架构，通过事件驱动的方式进行工作。核心组件如下：

+ **API Gateway:** 接收附件上传请求，并将元数据（文件ID、存储路径、类型）发布到消息队列。
+ **文件存储服务:** 使用对象存储（如AWS S3, MinIO）持久化附件。
+ **消息队列 (Message Queue):** 使用RabbitMQ或Apache Kafka解耦附件上传与摘要生成，确保系统高可用。
+ **摘要生成核心服务 (Summarizer Core):** 负责消费队列消息，执行核心逻辑。
- **LLM 服务:** 调用外部或内部部署的大语言模型（如GPT-4, Claude, 或本地部署的Llama 3）。

**工作流程:**
1.  **上传:** 用户通过API上传附件到`API Gateway`。
2.  **存储:** `API Gateway`将文件保存至`文件存储服务`，获取文件ID和存储路径。
3.  **通知:** `API Gateway`将`{file_id, file_type, storage_path, user_id}`消息发送至`消息队列`。
4.  **消费:** `Summarizer Core` 从队列中拉取消息。
5.  **提取:** 根据`file_type`，`Summarizer Core`调用相应的文本提取器：
    -   **PDF:** 使用`PyMuPDF`或`pdfplumber`提取文本。
    -   **DOCX:** 使用`python-docx`提取段落。
    -   **图片:** 使用OCR引擎（如`Tesseract`或`AWS Textract`）提取文字。
    -   **音频:** 使用语音转文字服务（如`Whisper`或`Google Speech-to-Text`）生成转录文本。
6.  **分块与预处理:** 如果提取的文本过长（超过LLM上下文窗口），则进行分块（Chunking），并保留每个块的核心内容。
7.  **生成摘要:** 构建Prompt，将提取的文本发送给`LLM服务`，请求生成摘要。
8.  **存储结果:** 将生成的摘要文本与`file_id`关联，存入数据库（如PostgreSQL或Redis）。
9.  **回调通知:** 通过Webhook或轮询接口通知用户摘要已就绪。

## 3. 关键技术实现细节

### 3.1 文本提取器模块化设计

为了提高可维护性，我们将文本提取器设计为插件模式。

```py
# 示例：抽象基类
from abc import ABC, abstractmethod

class TextExtractor(ABC):
    @abstractmethod
    def extract(self, file_path: str) -> str:
        """从给定文件路径提取纯文本"""
        pass

# 具体实现：PDF提取器
class PDFExtractor(TextExtractor):
    def extract(self, file_path: str) -> str:
        import pdfplumber
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return text

# 具体实现：图片OCR提取器
class ImageOCRExtractor(TextExtractor):
    def extract(self, file_path: str) -> str:
        import pytesseract
        from PIL import Image
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image, lang='eng+chi_sim') # 支持中英文
        return text

# 工厂模式注册
extractor_registry = {
    'pdf': PDFExtractor,
    'docx': DOCXExtractor, # 假设已实现
    'png': ImageOCRExtractor,
    'jpg': ImageOCRExtractor,
    'mp3': AudioTranscriber, # 假设已实现
}
```

### 3.2 摘要生成Prompt工程

Prompt的设计直接影响摘要质量。以下是一个经过优化的Prompt模板，用于生成结构化摘要。

```
你是一位专业的文档摘要专家。请根据以下提供的文本内容，生成一份摘要。

**要求：**
1.  **核心要点：** 提取文本中最重要的3-5个关键点，用列表形式呈现。
2.  **结论/主要论点：** 用一段话概括文本的核心结论或主要论点（不超过100字）。
3.  **行动项（如有）：** 如果文本包含明确的待办事项或决策，请列出。
4.  **语言：** 使用与原文相同的语言。
5.  **格式：** 使用Markdown格式输出。

**文本内容：**
{extracted_text}

**请开始生成摘要：**
```

**示例输出：**
```markdown
### 核心要点
* 项目Alpha的截止日期已从Q2推迟到Q3。
- 预算增加了15%，主要用于新的云基础设施采购。
+ 团队决定采用微服务架构重构核心模块。

### 结论/主要论点
项目Alpha因架构调整而延期，但获得了额外的预算支持，以确保新架构的顺利实施。

### 行动项
* [ ] 采购部门需在5月1日前完成云资源询价。
* [ ] 技术负责人需在4月15日前提交微服务拆分方案。
```

### 3.3 错误处理与重试机制

由于依赖外部LLM服务和OCR服务，网络不稳定或服务限流是常见问题。

* **指数退避重试:** 对于可重试的错误（如HTTP 429, 503），使用指数退避策略（1s, 2s, 4s, 8s...）重试最多3次。
* **死信队列:** 超过重试次数的消息将被发送到死信队列，由人工或定时任务处理。
+ **降级策略:** 如果LLM服务不可用，可以暂时返回基于关键词提取的简单摘要（如提取TF-IDF排名前10的句子），确保服务不彻底中断。

## 4. 部署与监控

- **容器化:** 使用Docker容器化所有服务，并通过Kubernetes进行编排。
- **监控指标:**
    - `summary_generation_latency`: 摘要生成延迟（P50, P99）。
    - `text_extraction_success_rate`: 文本提取成功率。
    - `llm_call_error_rate`: LLM调用错误率。
    - `queue_depth`: 待处理消息队列深度。
* **日志:** 使用结构化日志（JSON格式），便于在ELK或Grafana Loki中进行检索。

## 5. 总结

本`Attachment Summarizer Service`设计方案提供了一个健壮、可扩展且实用的实现路径。通过模块化提取器、精心设计的Prompt和健壮的错误处理机制，该服务能够可靠地将各种附件转化为有价值的摘要信息，显著提升用户效率。下一步工作将聚焦于具体的编码实现、单元测试覆盖以及性能基准测试。