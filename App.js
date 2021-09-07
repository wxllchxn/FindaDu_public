import React from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import DialogInput from 'react-native-dialog-input';
import Dialog from 'react-native-dialog';
import { Card } from 'react-native-elements'
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import { Marker } from 'react-native-maps';
import { Rating } from 'react-native-elements';
import Modal from 'react-native-modalbox';
const fetch = require('node-fetch');

var screen = Dimensions.get('window');

class HomeScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      isOpen: false,
      isDisabled: false,
      swipeToClose: true,
      showEntryBox: false,
      showReviewModal: false,
      goBack: false,
      sliderValue: 0.3,
      origLat: 0,
      origLon: 0,
      region: {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 1,
        longitudeDelta: 1,
      },
      review: {
        name: '',
        rating: 0,
        reviewBody: '',
      },
      restrooms: [],
      coords: [],
      x: 'false',
      concat: "",
      cordLatitude: 42.279594,
      cordLongitude: 83.732124,
      bottomText: 'Find Closest Restrooms',
      enterText: 'Enter Location',
      enterText2: 'Return to current Location',
      firstText: '',
      index: 0,
      modalName: '',
      modalAmenities: '',
      modalReviews: [],
      modalRating: 0.0,
    };
  }

  componentDidMount() {
    // console.log('component did mount');
    const success = position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      // console.log(latitude, longitude);
      this.setState({
        origLat: latitude,
        origLon: longitude,
        region: {
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0121,
        }
      });
    };
    const error = () => {
      console.log("Unable to retrieve your location");
    };
    navigator.geolocation.getCurrentPosition(success, error);
  }

  getUserMarker(){
    var tempLatLng = {
        'latitude': this.state.region.latitude,
        'longitude': this.state.region.longitude,
    };
    return <Marker
      key={0}
      coordinate={tempLatLng}
      pinColor={'gold'}
    />;
  }
      
  getMarkers(){
    var marker_list = [];
    for (var i = 0; i < this.state.restrooms.length; i++){
      let latlong = {
        'latitude': this.state.restrooms[i].latitude,
        'longitude': this.state.restrooms[i].longitude
      };
      let ind = i + 1;
      marker_list.push(<Marker
        key={ind}
        coordinate={latlong}
        title={this.state.restrooms[i].name}
        description={""}
        onPress={() => this.pressedMarker(ind-1)} 
      />);
    }
    return marker_list;
  }
                       
  onRegionChange(region) {
    // console.log('region change ' + region);
    // this.setState({ region });
  }

  onClose() {
    console.log('Modal just closed');
  }

  onOpen() {
    console.log('Modal just opened');
  }

  onClosingState(state) {
    console.log('the open/close of the swipeToClose just changed');
  }


  changeCurrPosition(newLocation) {
    let endpoint = 'api endpoint here';
    fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        this.setState({
            goBack: true,
            showEntryBox: false,
            region: {
              latitude: data.results[0].geometry.location.lat,
              longitude: data.results[0].geometry.location.lng,
              latitudeDelta: 0.0122,
              longitudeDelta: 0.0121,
            },
            firstText: ''
          })
      }).catch((err) => {
        console.log(err);
      });
  }

  mergeLot(restLat,restLon){
    let dest = restLat +","+restLon;
      
    if (this.state.region.latitude != null && this.state.region.longitude!=null)
     {
        let concatLot = this.state.region.latitude +","+this.state.region.longitude
        this.setState({
          concat: concatLot,
          modalName: '',
          modalAmenities: '',
          modalReviews: [],
          modalRating: 0.0,
        }, () => {
          this.getDirections(concatLot, dest);
        });
     }
   }

  async getDirections(startLoc, destinationLoc) {
      // console.log(startLoc, destinationLoc);
      try {
          let resp = await fetch('api endpoint here')
          let respJson = await resp.json();
          let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
          let coords = points.map((point, index) => {
              return  {
                  latitude : point[0],
                  longitude : point[1]
              }
          })
          this.setState({coords: coords})
          this.setState({x: "true"})
          return coords
      } catch(error) {
          // console.log(error)
          this.setState({x: "error"})
          return error
      }
  }

  async findClosestRestrooms(long, lat, radius) {
    // get closest restrooms
    let endpoint = 'api endpoint here';
    fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        // console.log(data)
        this.setState({
          restrooms: data,
          bottomText: 'Find Closest Restrooms',
        })
      }).catch((err) => {
        console.log(err);
      });
  }

  async addReview() {
    let endpoint = 'api endpoint here'

    let id = String(this.state.restrooms[this.state.index].latitude)+String(this.state.restrooms[this.state.index].longitude)
    let timestamp = new Date().toLocaleDateString();

    let submission = {
      method: 'post',
      body: JSON.stringify({
        id: id,
        name: this.state.review.name,
        timestamp: timestamp,
        review: this.state.review.reviewBody,
        rating: this.state.review.rating,
      }),
      headers: {'Content-Type': 'application/json'}
    }

    fetch(endpoint, submission)
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
        this.findClosestRestrooms(this.state.region['longitude'], this.state.region['latitude'], 1.23)
      }).catch((err) => {
        console.log(err);
      });
  }

  handleName(name) {
    let review = this.state.review
    review.name = name
    this.setState({
      review: review,
    });
  }

  handleRating(rating) {
    let review = this.state.review
    let parsedRating = parseInt(rating)
    
    if(Number.isNaN(parsedRating) || parsedRating > 5 || parsedRating < 1) {
      parsedRating = 0
    }

    review.rating = parsedRating

    this.setState({
      review: review,
    });
  }

  handleReview(reviewBody) {
    let review = this.state.review
    review.reviewBody = reviewBody
    this.setState({
      review: review,
    });
  }
  
  amenities(amenity_dict) {
    res = ""
    
    if(amenity_dict["paper"])
      res += '🧻'

    if(amenity_dict["sanitizer"])
      res += '🧴'
    
    if(amenity_dict["soap"])
      res += '🧼'

    return res
  }

  review() {
    reviews = [];
    for(let i = 0; i < this.state.modalReviews.length; i++){
      review = this.state.modalReviews[i]
      reviews.push(
        <View key={i} style={styles.reviewItem}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.text}>{review.name}, {review.timestamp}</Text>
          <Rating imageSize={20} readonly startingValue={review.rating} style={styles.rating}/>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.text}>{review.review}</Text>
        </View>
      )
    }

    return reviews
  }

  pressedMarker(index) {
    this.setState({
      index: index,
      modalName: this.state.restrooms[index].name, 
      modalImage: this.state.restrooms[index].image,
      modalAmenities: this.amenities(this.state.restrooms[index].amenities),
      modalReviews: this.state.restrooms[index].reviews,
      modalRating: parseFloat(this.state.restrooms[index].avg_rating),
    });
    this.refs.modal.open()
  }

  bottomButtonStyle = function(options) {
    if(this.state.bottomText == "Find Closest Restrooms"){
      return {
        elevation: 8,
        backgroundColor: "#147EFB",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        position: 'absolute',
        bottom: 30,
        left: 0, 
        right: 0,
        marginLeft:30,
        marginRight:30,
      }
    } else {
      return {
        elevation: 8,
        backgroundColor: "#999999",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        position: 'absolute',
        bottom: 30,
        left: 0, 
        right: 0,
        marginLeft:30,
        marginRight:30,
      }
    }
  }
  
  enterLocButtonStyle = function(options) {
    return {
        elevation: 8,
        width: 100,
        backgroundColor: "orange",
        borderRadius: 10,
        paddingVertical: 1,
        paddingHorizontal: 1,
        position: 'absolute',
        bottom: 90,
        left: 0, 
        right: 0,
        marginLeft:30,
        marginRight:30,
    }
  }
  
  enterLocButtonStyle2 = function(options) {
    return {
        elevation: 8,
        width: 150,
        backgroundColor: "orange",
        borderRadius: 10,
        paddingVertical: 1,
        paddingHorizontal: 1,
        position: 'absolute',
        bottom: 90,
        left: 160, 
        right: 0,
        marginLeft:30,
        marginRight:30,
    }
  }

  render() {
    return (
      <View style={styles.mapContainer}>
        <MapView style={styles.mapStyle}  region={this.state.region}
          onRegionChange={this.onRegionChange}>
          {this.getMarkers()}
          {this.getUserMarker()}
          
       {this.state.x == 'true' && <MapView.Polyline
            coordinates={this.state.coords}
            strokeWidth={2}
            strokeColor="red"/>
        }
        {this.state.x == 'error' && <MapView.Polyline
          coordinates={[
              {latitude: this.state.region.latitude, longitude: this.state.region.longitude},
              {latitude: this.state.cordLatitude, longitude: this.state.cordLongitude},
          ]}
          strokeWidth={2}
          strokeColor="red"/>
         }
        </MapView>

        <Modal style={styles.modal} position={"bottom"} ref={"modal"} swipeArea={20}>
          <ScrollView style={styles.scroll}>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.title}>{this.state.modalName}</Text>
            <View style={{flexDirection:"row"}}>
              <Image style={styles.image} source={{uri: this.state.modalImage}} />
              <View style={styles.right}>
                <Rating imageSize={30} readonly startingValue={this.state.modalRating} style={styles.rating}/>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.text}>Amenities: {this.state.modalAmenities}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.appButtonContainer}
              onPress={() => {
                this.refs.modal.close();
                this.mergeLot(this.state.restrooms[this.state.index].latitude,this.state.restrooms[this.state.index].longitude);
              }}>
              <Text style={styles.appButtonText}>Navigate to this restroom</Text>
            </TouchableOpacity>

            <Card>
              <Card.Title>Reviews</Card.Title>
              <Card.Divider/>
              {this.review()}
            </Card>

            <TouchableOpacity
              style={styles.appButtonContainer}
              onPress={() => {
                this.setState({
                  showReviewModal: !this.state.showReviewModal,
                });
              }}>
              <Text style={styles.appButtonText}>Add a review</Text>
            </TouchableOpacity>
            
          </ScrollView>
        </Modal>
        
        <DialogInput isDialogVisible={this.state.showEntryBox}
            title={""}
            message={"Enter New Location"}
            hintInput ={""}
            submitInput={(inputText) => this.changeCurrPosition(inputText)} 
            closeDialog={ () => this.setState({showEntryBox:false})}>
        </DialogInput>

        <Dialog.Container visible={this.state.showReviewModal}>
          <Dialog.Title>Leave A Review</Dialog.Title>
          <Dialog.Input label="Name" onChangeText={(name) => this.handleName(name)}></Dialog.Input>
          <Dialog.Input label="Rating" onChangeText={(rating) => this.handleRating(rating)}></Dialog.Input>
          <Dialog.Input label="Review" onChangeText={(reviewBody) => this.handleReview(reviewBody)}></Dialog.Input>
          <Dialog.Button label="Submit" onPress={() => {
              this.addReview()
              this.setState({
                showReviewModal: !this.state.showReviewModal,
              });
              this.refs.modal.close()
            }}/>
          <Dialog.Button label="Cancel" onPress={() => {
              this.setState({
                showReviewModal: !this.state.showReviewModal,
              });
            }}/>
        </Dialog.Container>

        <TouchableOpacity
          style={this.enterLocButtonStyle()}
          onPress={() => {
                this.setState({
                  showEntryBox: !this.state.showEntryBox,
                });
              }
            }>
          <Text style={styles.entButtonText}>{this.state.enterText}</Text>
        </TouchableOpacity>
        
        {this.state.goBack == true && <TouchableOpacity
          style={this.enterLocButtonStyle2()}
          onPress={() => {
                this.setState({
                    goBack: false,
                    region: {
                      latitude: this.state.origLat,
                      longitude: this.state.origLon,
                      latitudeDelta: 0.0122,
                      longitudeDelta: 0.0121,
                    },
                    x: 'false',
                    modalName: '',
                    modalAmenities: '',
                    modalReviews: [],
                    modalRating: 0.0,
                  });
                
              }
            }>
          <Text style={styles.entButtonText}>{this.state.enterText2}</Text>
        </TouchableOpacity>
        }
        
        <TouchableOpacity
          style={this.bottomButtonStyle()}
          onPress={() => {
            this.setState({
              bottomText: 'Loading...'
            }, () => {
              this.findClosestRestrooms(this.state.region['longitude'], this.state.region['latitude'], 1.23)
            });
          }}>
          <Text style={styles.appButtonText}>{this.state.bottomText}</Text>
        </TouchableOpacity>

      </View>
    );
  }

}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 50,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },

  mapContainer: {
    flex: 1,
  },

  mapStyle: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },

  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },

  btn: {
    margin: 10,
    backgroundColor: "#3B5998",
    color: "white",
    padding: 10
  },

  text: {
    color: "black",
    fontSize: 22
  },

  appButtonText: {
    fontSize: 18,
    color: "#fff",
    alignSelf: "center",
  },

  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
    borderRadius: 10,
  },

  scroll: {
    width: screen.width,
    paddingLeft: 10,
  },

  title: {
    color: "black",
    fontSize: 25,
    marginTop: 10,
    marginRight: 10,
    marginBottom: 10,
  },

  text: {
    color: "black",
    fontSize: 18,
  },

  image: {
    height: 135,
    flex: 1,
  },

  right: {
    flex:1,
    flexDirection: 'column',
    marginLeft: 10,
  },

  appButtonContainer: {
    elevation: 8,
    backgroundColor: "#147EFB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    left: 0, 
    right: 0,
    marginTop: 10,
    marginLeft:10,
    marginRight:10,
    marginBottom:20,
  },

  entButtonText: {
    fontSize: 12,
    color: "#fff",
    alignSelf: "center",
  },

  appButtonText: {
    fontSize: 18,
    color: "#fff",
    alignSelf: "center",
  },

  reviewItem: {
    marginBottom:10,
  },

  rating: {
    alignSelf: "flex-start",
    marginBottom: 5,
  }
});

export default HomeScreen;