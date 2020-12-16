import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import {BrowserRouter as Router, Switch, Route, Link, useParams } from "react-router-dom";
import logo from './assets/Fireside.svg';


import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

if (!firebase.apps.length) {
  firebase.initializeApp({

  });
}else {
  firebase.app();
}






const auth = firebase.auth(); 
const firestore = firebase.firestore();



function Base(){

  return(    
  
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/" component={App}/>
          <Route exact path="/room" component={RoomList}/>
          <Route exact path="/signin" component={SignIn}/>
          <Route path="/chat/:id" component={ChatRoom}/>
        </Switch>
      </Router>
  </div>)
}







function App() {
  const userRef = firestore.collection('users');
  const [user] = useAuthState(auth);
  
  useEffect(() => {
    const logUser = async() => {
      const { displayName, email } = auth.currentUser; 
      await userRef.add({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        email,
        displayName
      })
  
    }
    if (user){
      logUser();
  }
  }, [user, userRef]); //

  
  //{user ? <ChatRoom roomCode='general'/> : <SignIn/>}
  return (
    
    <div>
      
      {user ? <RoomList/> : <SignIn/>}
      
    </div>
  );
}


















function NavBar(){
  const [menu, toggle] = useState(false);
  const style = menu ? '' : 'hide'
  
  return(
   
  <div className='navbar'>
    <MoreMenu style={style}/> 
    <div onClick={() => toggle(!menu)} className='burger_menu'>
      <div className='burger_bar'></div>
      <div className='burger_bar'></div>
      <div className='burger_bar'></div>
    </div>
    <img src={logo} className='logo'/>
  </div>
  )  
}




















function MoreMenu(props){
  return(<div className={`more ${props.style}`}><Link to="/room" className="button sign_out">Chat Rooms</Link><SignOut/></div>)
}

















function SignOut(){
  return( auth.currentUser && (
    <button className="button sign_out" onClick ={() => auth.signOut()}>Sign Out</button> 
  ))
}


















function SignIn(){
  
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider(); 
    auth.signInWithPopup(provider);
  }

  return(
    <button className="button sign_in" onClick={signInWithGoogle}>Sign in with Google.</button>
    )
}















//function createRoom(roomName){
  //create new room 

  //firestore.doc('room-' + roomName + '/init').set({createdAt: firebase.firestore.FieldValue.serverTimestamp()});
  //firestore.doc('rooms/' + roomName).set({createdAt: firebase.firestore.FieldValue.serverTimestamp()});
//}














function ChatRoom(props){

  let params = useParams();
  
  const roomCode = params.id;
  const scrollToBottom = useRef();
  const room = firestore.collection(roomCode);
  const messagesRef = room;
  //const messagesRef = room;

  const query = messagesRef.orderBy('createdAt').limit(25);
  const [messages] = useCollectionData(query, {idField: 'id'});
  const [formValue, setMessage] = useState('');
  
  const sendMessage = async(e) => {
    e.preventDefault(); // keep the form from refreshing the page on submit
    
    const { uid, photoURL} = auth.currentUser; 
  
    await messagesRef.add({
      text: formValue, 
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid, 
      photoURL
    })

    setMessage('');

    scrollToBottom.current.scrollIntoView({ behavior: 'smooth'});
  }

  
  return (
    <div>
    <NavBar/>

    <div className="chat-room">
      <div className='messages'>{messages && messages.map(msg => <ChatMessage key={msg.id} message={msg}/>)}<div ref={scrollToBottom}></div></div>
      <div className='spacer'></div>
      <form className='text_input' onSubmit={sendMessage}> 
        <input className='input' value={formValue} onChange={(e) => setMessage(e.target.value)}/> 
        <button className="button" type='submit'>Send</button>
      </form>
    </div>
    </div>
  )

}



function changeRoom(room){
  console.log('in');
  <Link to={"/chat/" + room}/>
}




function RoomList(){
  
  const roomsRef = firestore.collection('rooms');
  const query = roomsRef.orderBy('createdAt').limit(25);
  const [rooms] = useCollectionData(query, {idField: 'id'});
  const [formValue, setRoom] = useState(''); 
  const [addRoom, setAddRoom] = useState(false);

  const createRoom = async(e) => {
    e.preventDefault(); // keep the form from refreshing the page on submit
    firestore.doc('room-' + formValue + '/init').set({createdAt: firebase.firestore.FieldValue.serverTimestamp()});
    firestore.doc('rooms/' + formValue).set({createdAt: firebase.firestore.FieldValue.serverTimestamp()});
    setRoom('');
    setAddRoom(!addRoom)
  }

  console.log(addRoom)
  

  return(
  <div className='roomlist'>
    <div className='greeting'>Welcome to Fireside, a Discord-like chat client. Choose a room above or feel free to create your own!</div>
    {rooms !== undefined ? rooms.map((room, idx) => 
      <Link key={idx} className='room' to={"/chat/" + room.id}>
        
          <div className="float">{room.id}</div>
        
      </Link>) : null
    }
    { addRoom ? 
      <div className='add_room '>
        <form onSubmit={createRoom}>
          <input className='createRoom_form' type='text' value={formValue} onChange={(e) => setRoom(e.target.value)}></input>
          <input className='createRoom_submit' type='submit'></input>
        </form>
      </div>
    : null}

    <div className='roomlist_toolbar'>
      <button className='add_button' onClick={() => setAddRoom(!addRoom)}>+</button>

    </div>
    
  </div>
  )

}












function ChatMessage(props){
  const {text, uid, photoURL} = props.message; 
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'recieved'
  const textClass = uid === auth.currentUser.uid ? 'text_sent' : 'text_recieved'
  
  return <div className={`message ${messageClass}`}>
    <img className='profile_image' alt='user' src={photoURL}></img>
    <p className={`message_text ${textClass}`}>{text}</p>
    </div>
}




export default Base;

/*
to deploy
https://www.youtube.com/watch?v=IDHfvpsYShs
*/
