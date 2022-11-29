import React, {Component, createRef} from 'react';
import {
  Appearance,
  Button,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import {Colors, Header} from 'react-native/Libraries/NewAppScreen';
import VideoControls from 'react-native-video-controls';

export class HomeScreen extends Component<{route: any; navigation: any}> {
  public state = {videoFile: ''};

  private player? = createRef<VideoControls>();
  private isDarkMode = Appearance.getColorScheme() === 'dark';

  private backgroundStyle = {
    backgroundColor: this.isDarkMode ? Colors.darker : Colors.lighter,
  };

  public render(): JSX.Element {
    return (
      <SafeAreaView style={this.backgroundStyle}>
        <StatusBar
          barStyle={this.isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={this.backgroundStyle.backgroundColor}
        />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={this.backgroundStyle}>
          <Header />
          <View style={this.backgroundStyle}>
            <Text>{this.state.videoFile}</Text>
            <Button
              onPress={async () => await this.buttonClickHandler()}
              title="Capture Video"
            />
            <View style={{marginTop: 20}}>
              <Text></Text>
            </View>
            <Button
              onPress={async () => await this.testButtonClickHandler()}
              title="Execute Test"
            />
          </View>
          {this.renderVideoPlayer()}
          {this.renderTestResult()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  private async buttonClickHandler(): Promise<void> {
    this.setState({videoFile: 'Capturing...'});
    if (!(await this.checkPermissions())) return;
    this.props.navigation.navigate('Camera');
  }

  private async testButtonClickHandler(): Promise<void> {
    this.setState({videoFile: 'Executing...'});
    if (!(await this.checkPermissions())) return;
    Date.now();

    this.props.navigation.navigate('Camera', {
      test: true,
      startTime: Date.now(),
    });
  }

  private async checkPermissions(): Promise<boolean> {
    let [cameraPermission, microphonePermission] = await Promise.all([
      Camera.getCameraPermissionStatus(),
      Camera.getMicrophonePermissionStatus(),
    ]);
    console.log('cameraPermission', cameraPermission);
    console.log('microphonePermission', microphonePermission);

    if (cameraPermission !== 'authorized')
      cameraPermission = await Camera.requestCameraPermission();

    if (microphonePermission !== 'authorized')
      microphonePermission = await Camera.requestMicrophonePermission();

    if (
      cameraPermission !== 'authorized' ||
      microphonePermission !== 'authorized'
    ) {
      return false;
    }

    return true;
  }

  private renderVideoPlayer(): JSX.Element {
    if (this.props.route.params?.videoPath == undefined) return <></>;
    return (
      <VideoControls
        source={{
          uri: this.props.route.params.videoPath,
        }}
        ref={this.player}
        repeat={true}
        style={{
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: 10,
          marginBottom: 10,
          width: 300,
          height: 600,
        }}
      />
    );
  }

  private renderTestResult(): JSX.Element {
    if (this.props.route.params?.success !== true) return <></>;
    const testTime =
      this.props.route.params?.endTime - this.props.route.params?.startTime;
    const recordingTime = this.props.route.params?.targetRecordingTime;
    return (
      <View style={this.backgroundStyle}>
        <Text>
          {`Test took ${testTime} ms\n${
            testTime - recordingTime
          } ms longer than the target recording time of ${recordingTime} ms`}
        </Text>
      </View>
    );
  }
}
