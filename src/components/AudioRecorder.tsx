 View, 
 Text, 
 TouchableOpacity, 
 StyleSheet, 
 Alert,
 Animated,
 Platform
 onRecordingComplete: (uri: string) => void;
 onRecordingError: (error: Error) => void;
 const [recording, setRecording] = useState<Audio.Recording | null>(null);
 const [isRecording, setIsRecording] = useState(false);
 = useState(0);
 const [recordingUri, setRecordingUri] = useState<string | null>(null);
 const [waveformData, setWaveformData] = useState<number[]>([]);
 const timerRef = useRef<NodeJS.Timer | null>(null);
 const startRecording = async () => {
   try {
     if (recording) {
       return;
     }
     
     // Setup recording
     const { recording: newRecording } = await Audio.Recording.createAsync(
       Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
     );
     
     setRecording(newRecording);
     setIsRecording(true);
     
     // Start timer
     const startTime = Date.now();
     timerRef.current = setInterval(() => {
       const elapsed = Math.floor((Date.now() - startTime) / 1000);
       setRecordingTime(elapsed);
     }, 1000);
   } catch (error) {
     onRecordingError(error as Error);
     stopRecording();
   }
 };
 const stopRecording = async () => {
   if (recording) {
     try {
       await recording.stopAndUnload();
       const uri = recording.getUri();
       setRecordingUri(uri);
       setRecording(null);
       setIsRecording(false);
       if (timerRef.current) {
         clearInterval(timerRef.current);
         timerRef.current = null;
       }
       
       // Call the completion callback with the recording URI
       onRecordingComplete(uri);
     } catch (error) {
       onRecordingError(error as Error);
     }
   }
 };
 const pauseRecording = async () => {
   if (isRecording && recording) {
     try {
       await recording.pause();
       setIsRecording(false);
     } catch (error) {
       onRecordingError(error as Error);
     }
   }
 };
 const resumeRecording = async () => {
   if (!isRecording && recording) {
     try {
       await recording.resume();
       setIsRecording(true);
     } catch (error) {
       onRecordingError(error as Error);
     }
   }
 };
 const cancelRecording = async () => {
   if (recording) {
     try {
       await recording.stopAndUnload();
       setRecording(null);
       setIsRecording(false);
       if (timerRef.current) {
         clearInterval(timerRef.current);
         timerRef.current = null;
       }
     } catch (error) {
       onRecordingError(error as Error);
     }
   }
 };
 return (
   <View style={styles.container}>
     <View style={styles.timerContainer}>
       <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
     </View>
     <View style={styles.controls}>
       <TouchableOpacity 
         style={styles.recordButton} 
         onPress={isRecording ? pauseRecording : resumeRecording}
       >
         <Text style={styles.buttonText}>
           {isRecording ? 'Pause' : 'Record'}
         </Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.controlButton} onPress={stopRecording}>
         <Text style={styles.buttonText}>Stop</Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.controlButton} onPress={cancelRecording}>
         <Text style={styles.buttonText}>Cancel</Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.controlButton} onPress={saveRecording}>
         <Text style={styles.buttonText}>Save</Text>
       </TouchableOpacity>
     </View>
     {waveformData.length > 0 && (
       <View style={styles.waveform}>
         <useWaveform data={waveformData} />
       </View>
     )}
   </View>
 );
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
 container: {
   flex: 1,
   padding: 20,
   backgroundColor: '#f0f0f0',
 },
 timerContainer: {
   alignItems: 'center',
   marginBottom: 20,
 },
 timer: {
   fontSize: 24,
   fontWeight: 'bold',
 },
 controls: {
   flexDirection: 'row',
   justifyContent: 'space-around',
   marginBottom: 20,
 },
 controlButton: {
   padding: 10,
   backgroundColor: '#007AFF',
   borderRadius: 8,
   margin: 10,
 },
 recordButton: {
   padding: 10,
   backgroundColor: '#FF3B30',
   borderRadius: 8,
   margin: 10,
 },
 buttonText: {
   color: 'white',
   fontWeight: 'bold',
 },
 waveform: {
   height: 100,
   backgroundColor: '#f0f0f0',
   margin: 20,
 },