// import React, { useState, useRef } from "react";
// import "./App.css"
// import {UnControlled as CodeMirror} from 'react-codemirror2'
// import "codemirror/lib/codemirror.css";
// import "codemirror/theme/material.css";
// import "codemirror/mode/javascript/javascript";
// import codemirror from "codemirror";
// import { Link } from 'react-router-dom';



// function App() {
//   const [textareaValue, setTextareaValue] = useState("");
//   const canvasRef = useRef(null);


//   const handleSubmit = () => {
//     console.log("Submitted:", textareaValue);
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//   };


//   const handleClear = () => {
//     setTextareaValue("");
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//   };

//   const codeToCanvas = (text) => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.font = "16px";
//     ctx.fillText(text, 30, 50);
//   }

//   return (
//     <div className="container">
//     <div className="navbar">
//       <ul>
//         <li>
//           <a href="/html/index.html" id="logo">Logo</a>
//         </li>
//       </ul>
//       <div className="navbar-links">
//         <ul>
//           <li>
//             <a href="/static/index.html">Home</a>    
//           </li>
//           <li>
//             <a href="/static/examples.html">Docs</a>    
//           </li>
//           <li>
//             <a href="/static/about.html">About Us</a>
//           </li>
//         </ul>
//       </div>
//       </div>
//       <div className="header">
//         <h1>Quilt NEOW</h1>
//       </div>
//       <div className="btn-container">
//             <button id="submit-button" onClick={handleSubmit}>
//               Submit
//             </button>
//             <button id="clear-button" onClick={handleClear}>
//               Clear
//             </button>
//         </div>
//       <div className="container2">
//         <div className="parser-container">
//           <CodeMirror
//             value=''
//             options={{
//               mode: 'javascript',
//               theme: 'material',
//               lineNumbers: true
//             }}
//             onChange={(editor, data, value) => {
//               setTextareaValue(value); 
//               codeToCanvas(value);
//                 }}
//             onInputRead={(editor, canvasRef) => {
//             }}
//               />
//         </div>
//         <div className="drawing-container">
//           <canvas id="canvas" ref={canvasRef}></canvas>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

// App.js
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Play from './Play';
import Home from './Home'
import About from './About'
import Examples from './Examples'

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route path="/about" element={<About />} />
      <Route path="/examples" element={<Examples />} />
    </Routes>
  );
}

export default App;


