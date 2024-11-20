import React, { useState, useRef, useEffect } from "react";
import styles from './App.css';
import { Controlled as CodeMirror } from 'react-codemirror2';
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/javascript/javascript";
import { Link } from 'react-router-dom';
import { Alert } from "bootstrap";
import parser from './parser';
import evaluator from './interpreter';

// Define a muted color palette
const colorPalette = {
    Red: '#b57c7c',        // Muted red
    Orange: '#d9a078',     // Muted orange
    Yellow: '#c8b77a',     // Muted yellow
    Green: '#85a586',      // Muted green
    Blue: '#6a8caf',       // Muted blue
    Purple: '#9e86a6',     // Muted purple
    Black: '#4d4d4d',      // Muted black
    Pink: '#d8a6b8',       // Muted pink
    Brown: '#a58c72',      // Muted brown
    Grey: '#b0b0b0'        // Muted grey
};

// Function to draw a single rectangle
function drawRectangle(ctx, x, y, width, height, color) {
    const mutedColor = colorPalette[color] || color;
    ctx.fillStyle = mutedColor;
    ctx.fillRect(x, y, width, height);
}


// Debugging function
function debugInput(input) {
  const errors = [];
  const VALID_FUNCTIONS = ["rect", "hor", "vert", "rot", "rep", "over"];
  const VALID_COLORS = [
      "red", "blue", "green", "yellow", "orange", "purple",
      "black", "pink", "brown", "grey"
  ];
  const VALID_ANGLES = [0, 90, 180, 270];

  // Preprocess input to remove empty lines
  const lines = input.split('\n').filter(line => line.trim() !== "");

  if (lines.length === 0) {
      return ["No code provided."];
  }

  lines.forEach((line, index) => {
      const spaceIndex = line.indexOf(' ');
      if (spaceIndex !== -1) {
          errors.push({
              message: "Unexpected space detected. Please remove all spaces.",
              line: index + 1,
              column: spaceIndex + 1,
          });
      }

      // Helper function to validate a function call
      function validateFunctionCall(funcString, startIndex) {
          const match = funcString.match(/^(\w+)\((.*)\)$/); // Match functionName(args)
          if (!match) {
              return {
                  message: `Invalid function call: '${funcString.trim()}'.`,
                  line: index + 1,
                  column: startIndex + 1,
              };
          }

          const [_, functionName, args] = match;

          // Check for capitalization errors in function names
          if (VALID_FUNCTIONS.includes(functionName.toLowerCase())) {
              if (functionName !== functionName.toLowerCase()) {
                  return {
                      message: `Function '${functionName}' must be lowercase.`,
                      line: index + 1,
                      column: startIndex + 1,
                  };
              }
          } else {
              return {
                  message: `Unknown function '${functionName}'.`,
                  line: index + 1,
                  column: startIndex + 1,
              };
          }

          // Parse arguments, respecting nested functions
          const argsList = [];
          let currentArg = '';
          let openParens = 0;

          for (let i = 0; i < args.length; i++) {
              const char = args[i];
              if (char === '(') openParens++;
              if (char === ')') openParens--;

              if (char === ',' && openParens === 0) {
                  argsList.push(currentArg.trim());
                  currentArg = '';
              } else {
                  currentArg += char;
              }
          }
          if (currentArg) argsList.push(currentArg.trim());

          // Validate each argument
          for (let argIndex = 0; argIndex < argsList.length; argIndex++) {
              const arg = argsList[argIndex];
              const argStartIndex = funcString.indexOf(arg, startIndex);

              if (functionName === "rot" && argIndex === 0) {
                  // Check for valid rotation angles
                  const angle = parseInt(arg, 10);
                  if (!VALID_ANGLES.includes(angle)) {
                      return {
                          message: `Invalid rotation angle '${arg}'. Allowed angles are 0, 90, 180, and 270.`,
                          line: index + 1,
                          column: argStartIndex + 1,
                      };
                  }
              } else if (VALID_COLORS.includes(arg.toLowerCase())) {
                  if (arg !== arg.toLowerCase()) {
                      return {
                          message: `Invalid capitalization '${arg}'. All colors must be lowercase.`,
                          line: index + 1,
                          column: argStartIndex + 1,
                      };
                  }
              } else if (/^\d+$/.test(arg)) {
                  continue; // Valid number
              } else if (arg.match(/^\w+\(.*\)$/)) {
                  const nestedError = validateFunctionCall(arg, argStartIndex);
                  if (nestedError) {
                      return nestedError;
                  }
              } else {
                  return {
                      message: `Invalid argument '${arg}' in '${funcString}'.`,
                      line: index + 1,
                      column: argStartIndex + 1,
                  };
              }
          }

          return null;
      }

      const mainError = validateFunctionCall(line, 0);
      if (mainError) {
          errors.push(mainError);
      }
  });

  return errors.length > 0 ? errors : ["No errors detected."];
}

function Play() {
    const [textInput, setTextInput] = useState(""); // Store input for handling submission
    const canvasRef = useRef(null);

    // Render design on the canvas based on input text
    const renderDesign = (design) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        design.patches.forEach(patch => {
            drawRectangle(
                ctx,
                patch.x * 50,       // Scale position for better visibility
                patch.y * 50,
                patch.width * 50,    // Scale width for better visibility
                patch.height * 50,
                patch.color
            );
        });
    };


  const codeToCanvas = (textInput) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "16px";
    ctx.fillText(textInput, 100, 100);
  }


    const handleClear = () => {
        setTextInput("");
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Only called on Submit button click
    const handleSubmit = () => {
      try {
          const debugErrors = debugInput(textInput);
          if (debugErrors.length && debugErrors[0] !== "No errors detected.") {
              const formattedErrors = debugErrors
                  .map(error => `Line ${error.line}, Column ${error.column}: ${error.message}`)
                  .join("\n");
              alert(`Debugging issues:\n${formattedErrors}`);
              return;
          }
  
          const parsedInput = parser.parse(textInput);
          const design = evaluator(parsedInput);
          renderDesign(design);
      } catch (error) {
          console.error("Error interpreting code:", error);
          alert(`[line ${error.location.start.line}, column ${error.location.start.column}] ${error.message}`)
      }
    };
    useEffect(() => {
      const keyPressed = (event) => {
          if (event.shiftKey && event.key === "Enter") {
              handleSubmit();
              event.preventDefault();
          } else if (event.shiftKey && event.key === "Backspace") {
              handleClear();
              event.preventDefault();
          }
      };
      window.addEventListener("keydown", keyPressed);
      return () => {
          window.removeEventListener("keydown", keyPressed);
      };
  }, [textInput]);



  return (

    <div className="play-container">
   <div className="navbar">
        <ul>
          <li><a href="/" id="logo">Quilt Designer</a></li>
        </ul>
        <div className="navbar-links">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/play">Play</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/examples">Docs</a></li>
          </ul>
        </div>
      </div>
      
      <div className="container2">

      <div className="button-help">
        <div className="btn-action">
          <code>Shift + Enter</code> <span>to submit</span>
        </div>
        <div className="btn-action">
          <code>Shift + Backspace</code> <span>to clear</span>
        </div>
      </div>  


        <div className="parser-container">
          <CodeMirror
            value={textInput}
            options={{
              mode: 'javascript',
              theme: 'material',
              lineNumbers: true,
              lineWrapping: true
            }}
            onBeforeChange={(editor, data, value) => setTextInput(value)}
        />
         
          </div>
          <div className="drawing-container">
            <canvas id="canvas" ref={canvasRef} width={400} height={400}></canvas>
          </div>
        </div>
        </div>
        
    );
    
  }

  export default Play;

