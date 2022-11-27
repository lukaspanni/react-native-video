import {
  ActivityIndicator,
  Text,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import React, {Component, createRef} from 'react';
import {
  Camera,
  CameraDevice,
  RecordVideoOptions,
  VideoFile,
} from 'react-native-vision-camera';
import {Icon} from '@rneui/base';
import {
  copyFile,
  DocumentDirectoryPath,
  exists,
  ExternalStorageDirectoryPath,
  mkdir,
  moveFile,
} from 'react-native-fs';

export class CameraScreen extends Component<{
  route: any;
  navigation: any;
}> {
  state: {
    cameraDevices: CameraDevice[];
    selectedIndex?: number;
    recording: boolean;
  } = {
    cameraDevices: [],
    recording: false,
  };

  private camera = createRef<Camera>();

  public render() {
    if (this.state.cameraDevices.length <= 0)
      return <ActivityIndicator size="large" />;

    if (this.state.selectedIndex == undefined)
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 22,
          }}>
          <ScrollView>
            <Text style={{fontSize: 28, color: 'white', marginBottom: 20}}>
              Select Camera
            </Text>
            {this.buildCameraDeviceList()}
          </ScrollView>
        </View>
      );

    return (
      <View style={StyleSheet.absoluteFill}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={this.state.cameraDevices[this.state.selectedIndex]}
          isActive={this.props.navigation.isFocused()}
          preset="high"
          enableZoomGesture={true}
          video={true}
          audio={true}
          ref={this.camera}
        />

        <TouchableOpacity
          onPress={() => this.toggleRecording()}
          style={{
            marginTop: '160%',
            marginLeft: 'auto',
            marginRight: 'auto',
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 10,
            borderRadius: 100,
            backgroundColor: 'grey',
          }}>
          <Text> {this.state.recording ? 'Stop' : 'Start'} </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={this.state.recording}
          onPress={() => this.setState({selectedIndex: undefined})}
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 50,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 2,
            borderRadius: 100,
            backgroundColor: 'grey',
          }}>
          <Text> Select </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={this.state.recording}
          onPress={() => this.props.navigation.goBack()}
          style={{
            position: 'absolute',
            top: 5,
            left: 5,
            width: 50,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 2,
            borderRadius: 100,
            backgroundColor: 'grey',
          }}>
          <Icon name="close" />
        </TouchableOpacity>
      </View>
    );
  }

  public async componentDidMount(): Promise<void> {
    this.setState({cameraDevices: await Camera.getAvailableCameraDevices()});
    console.debug('cameraDevices', this.state.cameraDevices);
  }

  private buildCameraDeviceList() {
    return this.state.cameraDevices
      .sort(
        (a, b) => a.position.length - b.position.length,
      ) /* sort by length of position -> back < front */
      .map((cameraDevice, index) => {
        return (
          <View key={index}>
            <Text
              style={{
                fontSize: 18,
                color: '#bbb',
                marginBottom: 10,
                textDecorationLine: 'underline',
              }}
              onPress={() => this.selectCameraDevice(index)}>
              {cameraDevice.name} - {cameraDevice.devices}
            </Text>
          </View>
        );
      });
  }

  private selectCameraDevice(index: number) {
    this.setState({selectedIndex: index});
    console.debug(
      'selected camera device',
      this.state.cameraDevices[index].name,
    );
    console.info(this.state.cameraDevices[index].formats[0]);
    console.info(this.state.cameraDevices[index].formats[1]);
  }

  private async toggleRecording() {
    const options: RecordVideoOptions = {
      flash: 'off',
      fileType: 'mp4',
      onRecordingError: error => console.error(error),
      onRecordingFinished: video => this.returnVideo(video),
      videoCodec: 'hevc', // iOS only
    };
    if (this.state.recording) {
      await this.camera.current?.stopRecording();
      this.setState({recording: false});
    } else {
      this.camera.current?.startRecording(options);
      this.setState({recording: true});
    }
  }

  private async returnVideo(video: VideoFile) {
    await this.storeVideo(video);
    console.debug('video', video);
    this.props.navigation.navigate('Home', {videoPath: video.path});
  }

  private async storeVideo(video: VideoFile) {
    await copyFile(video.path, await this.buildVideoPath(video));
  }

  private async buildVideoPath(video: VideoFile) {
    const targetDirectory = await new Promise<string>(async resolve => {
      if (Platform.OS === 'android') {
        const writeExternal = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        const readExternal = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
        if (
          writeExternal !== PermissionsAndroid.RESULTS.GRANTED ||
          readExternal !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          throw new Error('Permissions not granted');
        }
        resolve(ExternalStorageDirectoryPath + '/Documents/crossVideo');
      }
      resolve(DocumentDirectoryPath + '/crossVideo');
    });
    console.debug('targetDirectory', targetDirectory);
    if (!(await exists(targetDirectory))) await mkdir(targetDirectory);
    return targetDirectory + '/' + video.path.split('/').pop();
  }
}
