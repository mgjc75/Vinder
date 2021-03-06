import React, { Component } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableHighlight,
  Image,
  TextInput,
  TouchableOpacity,
  Modal
} from "react-native";
import { Card, List, Button } from "react-native-elements";
import { styles, googleStyle } from "./styles/map";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome,
  Foundation,
  Feather
} from "@expo/vector-icons";
import MapView from "react-native-maps";
import Loading from "./loading.js";
import { DrawerNavigator } from "react-navigation";
import geolib from "geolib";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import PopupDialog from "react-native-popup-dialog";
import dishes from "../dataMark/dishes.json";
import NavigationService from "../NavigationService";
import * as firebase from "firebase";

export default class MapPage extends Component {
  static navigationOptions = {
    gesturesEnabled: false
  };
  state = {
    currentPos: {
      latitude: 53.4808,
      longitude: -2.2426,
      latD: 0.02,
      lngD: 0.056
    },
    userPos: {
      latitude: 53.4808,
      longitude: -2.2426,
      latD: 0.02,
      lngD: 0.056
    },
    loading: true,
    dishes: [],
    pinType: "restaurants"
  };

  componentDidMount() {
    this.getUserLocation();
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId);
  }

  render() {
    const currentPos = {};
    if (this.state.loading) {
      return (
        <View style={styles.container}>
          <Loading />
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <Search
            updateLocation={this.updateLocation}
            getUserLocation={this.getUserLocation}
          />
          <FunctionIcons
            updatePinType={this.updatePinType}
            modalVisibility={this.state.modalVisibility}
            setModalVisible={this.setModalVisible}
          />
          <Map
            pinType={this.state.pinType}
            userPos={this.state.userPos}
            style={styles.map}
            updateLocation={this.updateLocation}
            currentPos={this.state.currentPos}
            dishes={this.state.dishes}
          />
          <Meals pinType={this.state.pinType} dishes={this.state.dishes} />
        </View>
      );
    }
  }

  updatePinType = pinType => {
    console.log("updating pin type");
    this.setState(
      {
        pinType: pinType
      },
      () => this.getPins(this.state.currentPos)
    );
  };

  getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      position => {
        this.setState(
          {
            currentPos: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latD: this.state.currentPos.latD,
              lngD: this.state.currentPos.lngD
            },
            userPos: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latD: this.state.currentPos.latD,
              lngD: this.state.currentPos.lngD
            }
          },
          () => this.getPins(this.state.currentPos)
        );
      },
      error => this.setState({ error: error.message }),
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 2000 }
    );
  };

  updateLocation = (
    lat,
    lng,
    latD = this.state.currentPos.latD,
    lngD = this.state.currentPos.lngD
  ) => {
    this.setState(
      {
        currentPos: {
          latitude: lat,
          longitude: lng,
          latD: latD,
          lngD: lngD
        }
      },
      () => this.getPins(this.state.currentPos)
    );
  };

  getPins = place => {
    console.log("getting pins:", this.state.pinType);
    const pinType = this.state.pinType;
    return fetch(
      `https://jfv21zsdwd.execute-api.eu-west-2.amazonaws.com/dev/${pinType}`
    )
      .then(res => res.json())
      .then(res => this.getLocalPins(res, place))
      .catch(err => console.log("error:" + err));
  };

  getLocalPins = (dishes, locationA) => {
    const dishesInRadius = dishes.filter(dish => {
      const locationB = {
        latitude: dish.latitude || dish.restaurant_latitude,
        longitude: dish.longitude || dish.restaurant_longitude
      };
      if (this.checkDistance(locationA, locationB)) {
        return dish;
      }
    });
    this.updateDishes(dishesInRadius);
  };

  updateDishes = dishesInRadius => {
    this.setState({
      dishes: dishesInRadius,
      loading: false
    });
  };

  checkDistance = (a, b) => {
    if (b.latitude === "null") {
      return false;
    } else {
      newA = {
        latitude: a.latitude,
        longitude: a.longitude
      };
      return geolib.isPointInCircle(newA, b, 500);
    }
  };
}

class FunctionIcons extends Component {
  render() {
    const { updatePinType } = this.props;
    return (
      <View style={styles.functionIcons}>
        <MaterialCommunityIcons
          onPress={() => this.popupDialog.show()}
          name="plus-circle-outline"
          size={33}
          color="#fff"
        />
        <PopupDialog
          containerStyle={styles.modal}
          ref={popupDialog => {
            this.popupDialog = popupDialog;
          }}
          haveOverlay={false}
          dialogStyle={styles.dialogStyle}
        >
          <View>
            <MaterialCommunityIcons
              onPress={() => updatePinType("dishes")}
              name="food"
              size={35}
              color="#fff"
            />
            <MaterialIcons
              onPress={() => updatePinType("restaurants")}
              name="location-city"
              size={35}
              color="#fff"
            />
            <Feather
              onPress={this.handleLogout}
              name="log-out"
              size={35}
              color="#fff"
            />
          </View>
        </PopupDialog>
      </View>
    );
  }

  handleLogout = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        console.log("signed out");
        NavigationService.navigate("LoginScreen", null);
      });
  };
}

/* ***SearchBar Component*** */
class Search extends Component {
  render() {
    return (
      <GooglePlacesAutocomplete
        placeholder="Search"
        minLength={2} // minimum length of text to search
        autoFocus={false}
        returnKeyType={"search"}
        fetchDetails={true}
        listViewDisplayed="true"
        onPress={(data, details = null) => {
          this.handleSubmit(details.geometry.location);
        }}
        getDefaultValue={() => {
          return "";
        }}
        query={{
          key: "AIzaSyA3to9-gUo2wfr4yBypCwbOsIr2866UFYE",
          language: "en",
          types: "(cities)"
        }}
        styles={googleStyle}
        nearbyPlacesAPI="GooglePlacesSearch"
        filterReverseGeocodingByTypes={[
          "locality",
          "administrative_area_level_3"
        ]}
        predefinedPlacesAlwaysVisible={true}
      />
    );
  }

  handleSubmit = location => {
    const lat = location.lat;
    const lng = location.lng;
    this.props.updateLocation(lat, lng);
  };
}

/* ***Map Component *** */
class Map extends Component {

    render () {
        const { latitude, longitude, latD, lngD }  = this.props.currentPos;
        return (
            <MapView
                style={styles.map}
                ref={map => {this.map = map}}
                initialRegion={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.056
                }}
                region={{
                    latitude,
                    longitude,
                    latitudeDelta: latD,
                    longitudeDelta: lngD
                }}
                showsUserLocation >
                <View style={styles.locateIcon}>
                    <FontAwesome onPress={this.centerToUser} name="map-marker"  
                        size={34} color="#92d935" />
                </View>
                <Zoom zoom={this.zoom} />
                <Marker
                    pinType={this.props.pinType}
                    dishes={this.props.dishes}
                />
            </MapView>
        )
    }

    zoom = (param) => {
        const { latitude, longitude, latD, lngD } = this.props.currentPos;

        if (param === 'out') {
            this.props.updateLocation(latitude, longitude, latD * 2, lngD * 2)
            this.map.animateToRegion({
                latitude,
                longitude,
                latD: latD * 2,
                lngD: lngD * 2,
            })
        } else {
            this.props.updateLocation(latitude, longitude, latD / 2, lngD / 2)
            this.map.animateToRegion({
                latitude,
                longitude,
                latD: latD / 2,
                lngD: lngD / 2,
            })
        }
    }

    centerToUser = () => {
        const { latitude, longitude, latD, lngD }  = this.props.userPos;
        this.props.updateLocation(latitude, longitude, latD, lngD)
        this.map.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: latD,
            longitudeDelta: lngD
        })
    }
    
    centerToUser = () => {
      const { latitude, longitude, latD, lngD } = this.props.userPos;
      this.props.updateLocation(latitude, longitude, latD, lngD);
      this.map.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: latD,
        longitudeDelta: lngD
      });
    };
};



class Zoom extends Component {
  render() {
    return (
      <View style={styles.zoomBox}>
        <MaterialIcons
          onPress={() => this.props.zoom("in")}
          name="zoom-in"
          size={35}
          color="#fff"
        />
        <MaterialIcons
          onPress={() => this.props.zoom("out")}
          name="zoom-out"
          size={35}
          color="#fff"
        />
      </View>
    );
  }
}

class Marker extends Component {
    render () {
        return (
            this.props.dishes.map((dish, i) => {
                return (
                    <MapView.Marker
                        key={dish.id}
                        coordinate={{
                            latitude: +dish.latitude || +dish.restaurant_latitude,
                            longitude: +dish.longitude || +dish.restaurant_longitude
                        }}
                        title={dish.name}
                    >
                    <MapView.Callout>
                        <View > 
                            <Button backgroundColor={'rgba(0,0,0,0.5)'} color={'white'} title={dish.name} onPress={() => this.handlePress(dish)}/>
                        </View>
                    </MapView.Callout>
                    </MapView.Marker>
                )
            })
        )
    }

    handlePress = (item) => {
        if (this.props.pinType === 'restaurants') {
            NavigationService.navigate('RestaurantScreen', { restaurant: item })
        } else {
            NavigationService.navigate('CommentScreen', null)
        }
    }
  };


/* ***Meals Component *** */
class Meals extends Component {
  render() {
    return (
        <View style={styles.meals}>
            <FlatList
              style={styles.meals}
              data={this.props.dishes}
              renderItem={({ item }, i) => this.renderCard(item)}
              keyExtractor={(item, i) => item.id.toString()}
            />
            <View style={styles.overlay}/>
        </View>
    );
  }

  renderCard = item => {
    return (
      <TouchableOpacity onPress={() => this.handlePress(item)}>
        <Card
          containerStyle={styles.mealCard}
          title={item.name}
          image={this.checkForImage(item)}
        >
          <View style={styles.mealText}>
            <Text style={styles.mealText}>{this.checkForType(item)}</Text>
            <View style={styles.mealText}>{this.showRating(item)}</View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  checkForType = (item) => {
    if (this.props.pinType === 'restaurants') {
      return item.address.slice(0, 21) + '...'
    } else {
      return item.restaurant_address.slice(0, 21) + '...'
    }
  }

  checkForImage = (item) => {
      if (item.image_url) {
          return {
            uri: item.image_url
          }
      } else if (item.dish_image_url) {
          return {uri: item.dish_image_url}
      } else {
        return {
            uri:
              "https://www.bbcgoodfood.com/sites/default/files/styles/recipe/public/recipe/recipe-image/2017/11/noodles.jpg?itok=Oalsb6ro"
          }
      }
  }

  showRating = item => {
    let price;
    if (item.price) {
      price = item.price ? item.price : "££";
      price = price.split("").length;
    } else {
      if (item.prices < 5) {
        price = 1;
      } else if (item.prices < 10) {
        price = 2;
      } else {
        price = 3;
      }
    }

    let images = [];
    for (let i = 0; i < price; i++) {
      images.push(<Foundation size={30} color="#82B935" key={i} name="pound" />);
    }
    return images;
  };

  handlePress = item => {
    if (this.props.pinType === "restaurants") {
      NavigationService.navigate("RestaurantScreen", { restaurant: item });
    } else {
      NavigationService.navigate("CommentsScreen", {
        dish: item
      });
    }
  };
}
