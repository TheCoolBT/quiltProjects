const {
    TAG_RECT, TAG_NAT_NUM, TAG_COLOR, TAG_HOR, TAG_VERT, TAG_PLUS, TAG_TIMES, TAG_VARIABLE, TAG_DEPENDENT_FUNC, TAG_ROTATION, TAG_ROT, TAG_REP,
    TAG_IDENTIFIER, TAG_VAR_CALL, TAG_OVER, TAG_PROGRAM, TAG_ASSIGNMENT
} = require('./parserASTfunction.js');

const parser = require("./parser.js");

//our environment is a javascript object
const environment = {};

//want some objects to hold information about the patches/designs
function Patch(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
}

function Design(maxWidth, maxHeight, patches) {
    this.width = maxWidth;
    this.height = maxHeight;
    this.patches = patches;
}

//some sample strings to parse
//testAST = parser.parse("(2+2)*(1+2)")
//testAST = parser.parse("(vert (rect 1 2) (rect 2 2))")
//testAST = parser.parse("(vert (vert (rect 2 2 red)(rect 2 2 blue))(vert (rect 2 2 yellow)(rect 2 2 green)))")
//testAST = parser.parse("(vert (rect 2 2) (hor (rect 1 2) (rect 2 2)))")
//testAST = parser.parse("(vert (hor (rect 2 2 blue) (rect 2 3 red)) (rect 2 3 yellow))")
//testAST = parser.parse("(vert (rect 1 2 red)(rect 2 2 blue)(rect 2 2 green)(rect 3 3 pink))")
//testAST = parser.parse("(vert (vert (rect 1 1 red)(rect 1 1 blue))(vert (rect 2 2 green)(rect 2 2 yellow))(vert (rect 3 3 black)(rect 3 3 pink)))")
//testAST = parser.parse("(vert (vert (rect 1 1 red)(rect 1 1 blue)(rect 1 1 red))(vert (rect 2 2 green)(rect 2 2 yellow)(rect 2 2 green))(vert (rect 3 3 black)(rect 3 3 pink)(rect 3 3 black)))")
//testAST = parser.parse("hor(vert(rect(1, 2, red), rect(1, 2, blue), rect(1, 2, red)), vert(rect(2, 2, yellow), rect(2, 2, green), rect(2, 2, yellow)), vert(rect(3, 2, black), rect(3, 2, pink), rect(3, 2, black)))")
//testAST = parser.parse("hor(hor(rect(1, 2, red), rect(1, 2, blue), rect(1, 2, red)), hor(rect(2, 2, yellow), rect(2, 2, green), rect(2, 2, yellow)), hor(rect(3, 2, black), rect(3, 2, pink), rect(3, 2, black)))")
//testAST = parser.parse("vert(rect(2, 2, red), rect(3, 3, blue))")
//testAST = parser.parse("vert(rect(3, 2, red), rect(3, 3, blue))")
//testAST = parser.parse("rep 4 rect(1, 2, red)")
//testAST = parser.parse("rep 4 vert(rect(3, 2, red), rect(3, 3, blue))")
//let testAST = parser.parse("rot 90 vert(rect(3, 2, red), rect(3, 3, blue))")
//let testAST = parser.parse("rect x = rect(3,2,blue);rect y = rect(3,2,red);vert(x, y);")

//console.log(testAST)
//console.log(evaluatorLogic(environment, testAST))
//evaluator(environment, testAST)

export default function evaluator(node) {
    return evaluatorLogic(environment, node);
}

//returns Design object, containing information about every patch that is to be displayed
function evaluatorLogic(env, node) {
    switch (node.tag) {
        case TAG_PROGRAM:
            for (let defn of node.definitions) {
                //Add everything to environment that needs to be there
                evaluatorLogic(env, defn) //FIXME would it be better to directly call evaluatorDefn?
            }
            return evaluatorLogic(env, node.quilt)

        case TAG_VARIABLE:
        case TAG_ASSIGNMENT://this is actually re-assignment, the initial assignment happens in Variable - but essentially doing the same thing as Variable
            evaluatorDefn(env, node)
            break;
        
        case TAG_VAR_CALL:
            //look up name in environment
            //return value
            return env[node.name]

        case TAG_IDENTIFIER:
            break;
       
        case TAG_NAT_NUM:
        case "NAT": //FIXME remove later when parser stuff is updated
            return node.value

        case TAG_ROTATION:
            return node.value

        case TAG_COLOR:
            return node.name
        
        case TAG_RECT:
            //single patch, initialize to origin, give it the width, height, color
            let width = evaluatorLogic(env, node.width)
            let height = evaluatorLogic(env, node.height)
            let color = evaluatorLogic(env, node.color) 
            return new Patch(0, 0, width, height, color) //set all patches to be at (0,0) initially, then update when combining into Design (in hor/vert/etc)
        
        case TAG_OVER:
            //Starting with simple case of having just two Patches 
            let anchor = node.anchor
            let firstDesignOver = evaluatorLogic(env, node.design[0])
            let allPatchesOver = [firstDesignOver]
            for (let i = 1; i < (node.design).length; i++) {
                let currentDesign = evaluatorLogic(env, node.design[i])
                switch(anchor) {
                    case "TL":
                        currentDesign.x = firstDesignOver.x
                        currentDesign.y = firstDesignOver.y
                        break;
                    case "TR":
                        currentDesign.x = (firstDesignOver.x + firstDesignOver.width) - currentDesign.width
                        currentDesign.y = firstDesignOver.y
                        break;
                    case "BL":
                        currentDesign.x = firstDesignOver.x
                        currentDesign.y = (firstDesignOver.y + firstDesignOver.height) - currentDesign.height
                        break;
                    case "BR":
                        currentDesign.x = (firstDesignOver.x + firstDesignOver.width) - currentDesign.width
                        currentDesign.y = (firstDesignOver.y + firstDesignOver.height) - currentDesign.height
                        break;
                    case "C":
                        currentDesign.x = firstDesignOver.width/2.0 - currentDesign.width/2.0
                        currentDesign.y = firstDesignOver.height/2.0 - currentDesign.height/2.0
                        break;
                    default:
                        console.log("Unsupported Anchor Tag")
                }
                allPatchesOver.push(currentDesign)
            }

            //FIXME height and width
            return new Design(firstDesignOver.width, firstDesignOver.height, allPatchesOver)

        case TAG_ROT:
            let angle = evaluatorLogic(env, node.angle)
            let designRot = evaluatorLogic(env, node.design)
            if (designRot instanceof Patch) {
                switch (angle) { 
                    case 0:
                    case 180: //no change needed
                        break; 
                    case 90:
                    case 270: //switch width and height
                        let tempWidth = designRot.width
                        designRot.width = designRot.height;
                        designRot.height = tempWidth
                        break;
                    default:
                        console.log("Angle not supported")
                }
            } else if (designRot instanceof Design) {
                //height and width of overall Design need to be switched if rotation is 90 or 270
                if (angle === 90 || angle === 270) {
                    let tempWidth = designRot.width
                    designRot.width = designRot.height;
                    designRot.height = tempWidth
                }
                for (let patch of designRot.patches) {
                    let x;
                    let y;
                    let tempWidth;
                    switch (angle) { //assuming clockwise rotation
                        case 0: //no change needed
                            // | | |
                            // | |*|
                            break; 
                        case 90:
                            // | | |
                            // |*| |
                            patch.y += patch.height //moving to what the reference corner should be after the rotation
                            x = patch.x
                            y = patch.y
                            patch.x = Math.cos(angle*(Math.PI/180))*x - Math.sin(angle*(Math.PI/180))*y //equations to rotating round origin
                            patch.y = Math.sin(angle*(Math.PI/180))*x + Math.cos(angle*(Math.PI/180))*y //will result in clockwise movement
                            
                            tempWidth = patch.width //since 90 degrees, the widths and the heights will be switched
                            patch.width = patch.height;
                            patch.height = tempWidth
                            
                            patch.x += designRot.width //in order to display in the correct position on canvas, have to perform translation
                            break;
                        case 180: 
                            // |*| |
                            // | | |
                            patch.x += patch.width //appropriate reference corner
                            patch.y += patch.height
                            x = patch.x
                            y = patch.y
                            patch.x = Math.cos(angle*(Math.PI/180))*x - Math.sin(angle*(Math.PI/180))*y //equations to rotating round origin
                            patch.y = Math.sin(angle*(Math.PI/180))*x + Math.cos(angle*(Math.PI/180))*y //will result in clockwise movement
                            
                            patch.x += designRot.width //have to move horizontally and vertically 
                            patch.y += designRot.height 
                            break;
                        case 270: 
                            // | |*|
                            // | | |
                            patch.x += patch.width //appropriate reference corner
                            x = patch.x
                            y = patch.y
                            patch.x = Math.cos(angle*(Math.PI/180))*x - Math.sin(angle*(Math.PI/180))*y //equations to rotating round origin
                            patch.y = Math.sin(angle*(Math.PI/180))*x + Math.cos(angle*(Math.PI/180))*y //will result in clockwise movement
                            
                            tempWidth = patch.width //since 180 degrees, the widths and the heights will be switched
                            patch.width = patch.height;
                            patch.height = tempWidth
                            
                            patch.y += designRot.height //this has to just move vertically since it's above (below) the x-axis (screen coordingates upside down)
                            break;
                        default:
                            console.log("Angle not supported")
                    }
                }
            } else {
                console.log("this is not a Patch or Design, something went wrong")
            }
            return designRot;

        case TAG_REP: //assuming we are repeating in the x direction
            console.log("NODE.DESIGN", node.design)
            let original = evaluatorLogic(env, node.design)
            console.log('ORIGINAL:', original)
            let numRepetitions = evaluatorLogic(env, node.value)
            let allPatchesRep = []

            if (original instanceof Patch) {
                allPatchesRep.push(original)
                let prevX = original.x
                for (let i = 1; i < numRepetitions; i++) { //start at 1 since we've already taken care of the first repetition
                    let newRep = new Patch(prevX + original.width, original.y, original.width, original.height, original.color)
                    allPatchesRep.push(newRep)
                    prevX = newRep.x
                }
            } else if (original instanceof Design) {
                allPatchesRep.push(original.patches)
                allPatchesRep = allPatchesRep.flat() //to ensure 1d array
                for (let i = 1; i < numRepetitions; i++) {
                    let newRep = structuredClone(original) //deep copy - doesn't display the word "Patch" when logged to console
                    for (let patch of newRep.patches) {
                        patch.x += (i * original.width) //i represents which repetition we are on, so this calculation will give us the correct offset
                        allPatchesRep.push(patch)
                    }
                }
            }
            return new Design(original.width*numRepetitions, original.height, allPatchesRep)


        case TAG_HOR:
           //first one we don't change, it will be positioned at the origin
           let firstDesignHor = evaluatorLogic(env, node.design[0])
           let allPatchesHor = [] //keep track of all patches to put in the new Design object
           let prevPatchHor = {} //keep track of the last patch processed for calculating the next coordinates
           let heightHor = null
           if (firstDesignHor instanceof Patch) {
               allPatchesHor.push(firstDesignHor)
               prevPatchHor = firstDesignHor //keep track of last patch
               heightHor = firstDesignHor.height //height to match is height of this single patch
           } else if (firstDesignHor instanceof Design) {
               allPatchesHor.push(firstDesignHor.patches)
               allPatchesHor = allPatchesHor.flat() // so that we just have a 1D array
               prevPatchHor = firstDesignHor.patches[(firstDesignHor.patches).length - 1] //keep track of very last patch
               heightHor = firstDesignHor.height //height to match is the overall height of this design
           } else {
               console.log("First element is not a Patch or Design, something went wrong")
           }
           
           //now we process all of the rest of the patches/designs
           let sumWidthsHor = firstDesignHor.width //since this is placing horizontally, we add all the widths to get the overall Design width
           let cumulativeWidths = firstDesignHor.width //need to keep track of where to place designs after the first two
           for (let i = 1; i < (node.design).length; i++) { //start at index 1 bc already took care of the first one
                let currentDesign = evaluatorLogic(env, node.design[i]) //recursively process the very next Patch/Design
                if (currentDesign.height !== heightHor) { //check to make sure heights are compatable, works regardless of if it's a Design or a Patch
                    console.error("Input Error: Heights need to be the same in order to place Patches horizontally.")
                    throw new Error("Incompatable Height");
                    //return "unsuccessful :( please make sure heights match when using hor()";
                }

                if (currentDesign instanceof Patch) { //Patch case is easier since we only have to worry about a single Patch
                    currentDesign.x = (prevPatchHor.width + prevPatchHor.x) //since hor, this calculation will give us the correct x-value
                    sumWidthsHor += currentDesign.width //width bookkeeping
                    allPatchesHor.push(currentDesign) //add updated Patch to our collection
                    prevPatchHor = currentDesign //making sure to update prevPatch so that the next processed Patch has the correct information
                } else if (currentDesign instanceof Design) { //Design case more complicated since we have to loop through all the Patches inside
                    let lastPatch = {}
                    for (let patch of currentDesign.patches) {
                        //patch.x += (prevPatchHor.width + prevPatchHor.x) //FIXME this doesn't work for overlay
                        patch.x += cumulativeWidths
                        allPatchesHor.push(patch) //add updated Patches as we modify each
                        lastPatch = patch 
                    }
                    cumulativeWidths += currentDesign.width
                    prevPatchHor = lastPatch
                    sumWidthsHor += currentDesign.width //width bookkeeping
                } else {
                   console.log("Not a Patch or Design, something went wrong")
                }
            }         
            
            return new Design(sumWidthsHor, heightHor, allPatchesHor)


        case TAG_VERT:
           //first one we don't change, it will be positioned at the origin
           let firstDesignVert = evaluatorLogic(env, node.design[0])
           let allPatchesVert = [] //keep track of all patches to put in the new Design object
           let prevPatchVert = {} //keep track of the last patch processed for calculating the next coordinates
           let widthVert = null //first Patch will determine the width for the Vert
           if (firstDesignVert instanceof Patch) {
               allPatchesVert.push(firstDesignVert)
               prevPatchVert = firstDesignVert //keep track of last patch
               widthVert = firstDesignVert.width 
           } else if (firstDesignVert instanceof Design) {
               allPatchesVert.push(firstDesignVert.patches)
               allPatchesVert = allPatchesVert.flat() // so that we just have a 1D array
               prevPatchVert = firstDesignVert.patches[(firstDesignVert.patches).length - 1] //keep track of very last patch
               widthVert = firstDesignVert.width
           } else {
               console.log("First element is not a Patch or Design, something went wrong")
           }
           
           //now we process all of the rest of the patches/designs
           let sumHeightsVert = firstDesignVert.height //since this is placing vertically, we add all the heights to get the overall Design height
           let cumulativeHeights = firstDesignVert.height
           for (let i = 1; i < (node.design).length; i++) { //start at index 1 bc already took care of the first one
                let currentDesign = evaluatorLogic(env, node.design[i]) //recursively process the very next Patch/Design
                if (currentDesign.width !== widthVert) { //check to make sure widths are compatable, works regardless of if it's a Design or a Patch
                    console.error("Input Error: Widths need to be the same in order to place Patches vertically.")
                    return "unsuccessful :( please make sure widths match when using vert()";
                }
                if (currentDesign instanceof Patch) { //Patch case is easier since we only have to worry about a single Patch
                    currentDesign.y = (prevPatchVert.height + prevPatchVert.y) //since vert, this calculation will give us the correct y-value
                    sumHeightsVert += currentDesign.height //height bookkeeping
                    allPatchesVert.push(currentDesign) //add updated Patch to our collection
                    prevPatchVert = currentDesign //making sure to update prevPatch so that the next processed Patch/Design has the correct information
                } else if (currentDesign instanceof Design) { //Design case more complicated since we have to loop through all the Patches inside
                    let lastPatch = {} //eventually will want to set prevPatchVert to be the last Patch in the Design
                    for (let patch of currentDesign.patches) {
                        //patch.y += (prevPatchVert.height + prevPatchVert.y) //doesn't work with overlay
                        patch.y += cumulativeHeights
                        allPatchesVert.push(patch) //add updated Patches as we modify each
                        lastPatch = patch //when for loop terminates, lastPatch will contain the very last patch in the Design
                    }
                    cumulativeHeights += currentDesign.height //incrementing to prepare for next design
                    prevPatchVert = lastPatch //make sure to update for next Patch/Design
                    sumHeightsVert += currentDesign.height //height bookkeeping, design should already know its overall height
                } else {
                   console.log("Not a Patch or Design, something went wrong")
                }
            }         

            return new Design(widthVert, sumHeightsVert, allPatchesVert)

        case TAG_PLUS:
            return evaluatorLogic(env, node.left) + evaluatorLogic(env, node.right)

        case TAG_TIMES:
            return evaluatorLogic(env, node.left) * evaluatorLogic(env, node.right)
        
        default:
            console.log(node.tag, "Tag does not match any implemented tags - evaluatorLogic()")
    }
}


function evaluatorDefn (env, node) {
    switch (node.tag) {
        case TAG_VARIABLE:
        case TAG_ASSIGNMENT:
            //console.log("BEFORE", env)
            env[node.name] = evaluatorLogic(env, node.value) //store evaluated value in environment 
            //console.log("AFTER", env)
            break;

        case TAG_DEPENDENT_FUNC:
            let key = node.name //we should change the name of these
            env[`${key}`] = [node.args, node.body] //is this right idk im so tired
            break;
        
        default:
            console.log("Tag does not match any implemented tags - evaluatorDefn")
    }
}