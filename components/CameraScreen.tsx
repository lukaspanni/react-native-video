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
  AutoFocusSystem,
  Camera,
  CameraDevice,
  CameraDeviceFormat,
  ColorSpace,
  FrameRateRange,
  RecordVideoOptions,
  VideoFile,
  VideoStabilizationMode,
} from 'react-native-vision-camera';
import {Icon} from '@rneui/base';
import {
  copyFile,
  DocumentDirectoryPath,
  exists,
  ExternalStorageDirectoryPath,
  mkdir,
} from 'react-native-fs';

type VideoFormat = {
  videoWidth: number;
  videoHeight: number;
  colorSpace: ColorSpace[];
  hdr: 'HDR' | 'SDR';
  frameRateRanges: FrameRateRange[];
  minISO: number;
  maxISO: number;
  fieldOfView: number;
  autoFocusSystem: AutoFocusSystem;
  videoStabilization: VideoStabilizationMode[];
};

export class CameraScreen extends Component<{
  route: any;
  navigation: any;
}> {
  state: {
    cameraDevices: CameraDevice[];
    selectedIndex?: number;
    recording: boolean;
    useFormat: boolean;
    selectedFormat?: number;
    fps?: number;
  } = {
    cameraDevices: [],
    recording: false,
    useFormat: false,
  };

  private camera = createRef<Camera>();

  private resolveTestFinished?: () => void;
  private testFinishedPromise = new Promise<void>(resolve => {
    this.resolveTestFinished = resolve;
  });
  private resolveTestReady?: () => void;
  private testReadyPromise = new Promise<void>(resolve => {
    this.resolveTestReady = resolve;
  });

  private readonly recordingTime = 10000;

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

    if (this.state.useFormat && this.state.selectedFormat == undefined) {
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
              Select Format
            </Text>
            {this.buildFormatList()}
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={StyleSheet.absoluteFill}>
        {this.buildCameraElement()}

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

  private buildCameraElement() {
    if (this.state.selectedIndex == undefined)
      throw new Error('No camera selected');
    const cameraDevice = this.state.cameraDevices[this.state.selectedIndex];
    if (this.state.useFormat && this.state.selectedFormat !== undefined) {
      return (
        <Camera
          style={StyleSheet.absoluteFill}
          device={cameraDevice}
          isActive={this.props.navigation.isFocused()}
          onInitialized={() => this.resolveTestReady!()}
          format={cameraDevice.formats[this.state.selectedFormat]}
          fps={this.state.fps}
          enableZoomGesture={true}
          video={true}
          audio={true}
          ref={this.camera}
        />
      );
    }

    return (
      <Camera
        style={StyleSheet.absoluteFill}
        device={cameraDevice}
        isActive={this.props.navigation.isFocused()}
        onInitialized={() => this.resolveTestReady!()}
        preset="high"
        enableZoomGesture={true}
        video={true}
        audio={true}
        ref={this.camera}
      />
    );
  }

  public async componentDidMount(): Promise<void> {
    this.setState({cameraDevices: await Camera.getAvailableCameraDevices()});
    console.debug('cameraDevices', this.state.cameraDevices);

    //execute test code
    if (this.props.route.params?.test) {
      await Camera.getAvailableCameraDevices();
      this.setState({selectedIndex: 0, useFormat: false}); // use default-camera
      await this.testReadyPromise;
      await this.toggleRecording();
      await new Promise(resolve =>
        setTimeout(resolve as any, this.recordingTime),
      );
      await this.toggleRecording();
      await this.testFinishedPromise;
      console.log('Test finished');
      this.props.navigation.navigate('Home', {
        test: true,
        success: true,
        startTime: this.props.route.params.startTime,
        endTime: Date.now(),
        targetRecordingTime: this.recordingTime,
      });
    }
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

  private buildFormatList() {
    if (this.state.selectedIndex == undefined) return;
    const views: JSX.Element[] = [];
    this.reduceToUniqueVideoFormats(
      this.state.cameraDevices[this.state.selectedIndex].formats,
    ).forEach((format, index) => {
      views.push(
        <View key={index}>
          <Text
            style={{
              fontSize: 18,
              color: '#bbb',
              marginBottom: 10,
              textDecorationLine: 'underline',
            }}
            onPress={() => this.selectFormat(index)}>
            {`${format.videoWidth}x${format.videoHeight} (${format.hdr} - ${
              format.colorSpace
            })\nFramerates: [${format.frameRateRanges
              .map(v => v.minFrameRate + '-' + v.maxFrameRate + ' fps')
              .join(', ')}]\nISO ${format.minISO} - ${format.maxISO}\nFOV: ${
              format.fieldOfView
            }°, AF: ${format.autoFocusSystem}\nStabilization: ${
              format.videoStabilization
            }`}
          </Text>
        </View>,
      );
    });

    return views;
  }

  private reduceToUniqueVideoFormats(
    formats: CameraDeviceFormat[],
  ): Map<number, VideoFormat> {
    const uniqueVideoFormats = new Set();
    const reducedFormat = new Map<number, VideoFormat>();

    formats
      .map<VideoFormat>(format => ({
        videoWidth: format.videoWidth,
        videoHeight: format.videoHeight,
        colorSpace: format.colorSpaces,
        hdr: format.supportsVideoHDR ? 'HDR' : 'SDR',
        frameRateRanges: format.frameRateRanges,
        minISO: format.minISO,
        maxISO: format.maxISO,
        fieldOfView: format.fieldOfView,
        autoFocusSystem: format.autoFocusSystem,
        videoStabilization: format.videoStabilizationModes,
      }))
      .forEach((format, index) => {
        if (!uniqueVideoFormats.has(JSON.stringify(format))) {
          uniqueVideoFormats.add(JSON.stringify(format));
          reducedFormat.set(index, format);
        } else {
          console.log('Duplicate format: ', format);
        }
      });

    return reducedFormat;
  }

  private selectCameraDevice(index: number) {
    this.setState({selectedIndex: index, useFormat: true});
    console.debug(
      'selected camera device',
      this.state.cameraDevices[index].name,
    );
    console.info(this.state.cameraDevices[index].formats[0]);
    console.info(this.state.cameraDevices[index].formats[1]);
  }

  private selectFormat(index: number) {
    if (this.state.selectedIndex == undefined) return;
    const format =
      this.state.cameraDevices[this.state.selectedIndex].formats[index];
    const fps =
      format.frameRateRanges[format.frameRateRanges.length - 1].maxFrameRate;
    this.setState({selectedFormat: index, fps: fps});
    console.debug('Selected Format: ', format, 'fps: ', fps);
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
    if (this.props.route.params?.test) {
      this.resolveTestFinished!();
    } else {
      this.props.navigation.navigate('Home', {videoPath: video.path});
    }
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
