import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const audioRecorderPlayer = new AudioRecorderPlayer();

export const AudioNoteRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);

  const onStartRecord = async () => {
    const result = await audioRecorderPlayer.startRecorder();
    audioRecorderPlayer.addRecordBackListener((e) => {
      console.log('Recording at: ', e.currentPosition);
    });
    setIsRecording(true);
    console.log(result);
  };

  const onStopRecord = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setIsRecording(false);
    console.log(result);
    Alert.alert('Recording saved', 'Audio note captured successfully.');
  };

  return (
    <View>
      <Button title={isRecording ? "Stop Recording" : "Start Audio Note"} 
              onPress={isRecording ? onStopRecord : onStartRecord} />
    </View>
  );
};
