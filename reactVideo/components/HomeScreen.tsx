import React, {Component} from 'react';
import {
  Appearance,
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import {Colors, Header} from 'react-native/Libraries/NewAppScreen';

export class HomeScreen extends Component<{route: any; navigation: any}> {
  public state = {videoFile: ''};

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
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  private async buttonClickHandler(): Promise<void> {
    this.setState({videoFile: 'Capturing...'});
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
    )
      return;

    this.props.navigation.navigate('Camera');

    this.setState({videoFile: 'TEST'});
  }
}
