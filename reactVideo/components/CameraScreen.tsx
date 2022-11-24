import {
  ActivityIndicator,
  Text,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Button,
} from 'react-native';
import React, {Component} from 'react';
import {Camera, CameraDevice} from 'react-native-vision-camera';

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
        />

        <TouchableOpacity
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
    this.state.cameraDevices[index].formats.forEach(format =>
      console.debug(
        format.frameRateRanges.map(f => f.maxFrameRate),
        '\n',
      ),
    );
  }
}
