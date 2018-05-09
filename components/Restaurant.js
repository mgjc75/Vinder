import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  ImageBackground,
  StatusBar,
  TouchableOpacity,
  TouchableHighlight,
  TextInput,
  ScrollView,
  KeyboardAvoidingView
} from "react-native";

import { Ionicons, FontAwesome } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { ListItem, List, Card, Button } from "react-native-elements";
import PopupDialog from "react-native-popup-dialog";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { ImagePicker, Permissions } from "expo";
import KeyboardSpacer from "react-native-keyboard-spacer";
import dishes from "../data-jo/dishes.json";
import AddDish from "./AddDish";
import styles from './styles/restaurant'; 
import axios from 'axios';


export default class Restaurant extends React.Component {
  static navigationOptions = {
    gesturesEnabled: true
}
  state = { meal: "", description: "" };

  render() {
    const { image } = this.state;
    return (
      <ImageBackground
        source={require("./images/tattu.png")}
        style={styles.image}
      >
        <StatusBar backgroundColor="blue" barStyle="light-content" />

        <View style={styles.boxContainer}>
          <View style={styles.venueInfoContainer}>
            <View style={styles.venue}>
              <Text style={styles.text}>{"Tattu"}</Text>

              <View style={styles.logos}>
                <FontAwesome
                  style={styles.laptop}
                  name="laptop"
                  size={40}
                  color="white"
                />

                <FontAwesome
                  style={styles.laptop}
                  name="mobile-phone"
                  size={40}
                  color="white"
                />
                <TouchableOpacity onPress={() => this.popupDialog.show()}>
                  <FontAwesome
                    name="plus-square-o"
                    style={styles.laptop}
                    size={40}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <PopupDialog
            width={350}
            height={600}
            borderRadius={25}
            dialogStyle={{ backgroundColor: "#B1C595" }}
            ref={popupDialog => {
              this.popupDialog = popupDialog;
            }}
          >
            <KeyboardAwareScrollView behavior="padding" enabled>
              <View style={styles.popup}>
                <AddDish
                saveNewMeal={this.saveNewMeal}
                alertFail={this.alertFail}
                />

                <TouchableOpacity
                  style={styles.buttonContainer}
                  onPress={this.handleSave}
                >
                  <Text style={styles.button}>Save</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAwareScrollView>
          </PopupDialog>

          <FlatList
            style={styles.list}
            data={dishes}
            renderItem={({ item }, i) => (
              <Card
                title={item.title}
                key={`${i}${item}`}
                containerStyle={styles.contentContainer}
              />
            )}
            keyExtractor={item => item.title}
          />
        </View>
      </ImageBackground>
    );
  }

  handleSave = () => {
    // handle request here using state to create new dish
    axios
      .post('https://y2ydaxeo7k.execute-api.eu-west-2.amazonaws.com/dev/dish', {
        description: this.state.description,
        name: this.state.meal,
        imageURL: this.state.imageUrl,
        price: this.state.price,
        resId: this.state.resId
      })
      .then(res => {
        console.log(Res)
      })

      
    this.popupDialog.dismiss()
  }

  saveNewMeal = (addDishState) => {
    const { imageUrl, comment, meal } = addDishState;
    this.setState({
      meal,
      imageUrl,
      description: comment
    })
  }

  alertFail = () => {

  }
}
