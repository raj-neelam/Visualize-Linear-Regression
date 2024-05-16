import { Canvas } from './canvas_util.js';
import { Data } from './regressor_util.js';
import { Regressor } from './regressor_util.js';

var c = new Canvas(0.8, 0.9)

const numberofdatapointsEmt = document.getElementById("numberOfDataPoints");
const showGridsEmt = document.getElementById("show_grid");
const datapoints_number = document.getElementById('numberOfDataPointsView')
const new_data_button = document.getElementById('newData')
const regressorEmt = document.getElementById("regress");
const showError = document.getElementById("distance");

document.addEventListener('contextmenu', event => event.preventDefault());

showGridsEmt.checked=true
showError.checked=true
regressorEmt.checked=true
datapoints_number.textContent = numberofdatapointsEmt.value

function create_Grid(){
    let lines_x = 12
    let gap_x = c.width/lines_x
    for (let i = 0; i < lines_x; i++) {
        c.line(gap_x*i,0, gap_x*i, c.height, 1, 'gray')
    }
    let lines_y = 8
    let gap_y = c.height/lines_y
    for (let i = 0; i < lines_y; i++) {
        c.line(0,gap_y*i, c.width, gap_y*i, 1, 'gray')
    }
    c.line(c.width*.5,0,c.width*.5,c.height,3, 'white')
    c.line(0,c.height*.5,c.width,c.height*.5,3, 'white')
}


var data = new Data(numberofdatapointsEmt.value,c)
var regressor = new Regressor(c)


numberofdatapointsEmt.addEventListener("input", ()=>{
    datapoints_number.textContent = numberofdatapointsEmt.value
    var new_num = numberofdatapointsEmt.value
    data.trim(new_num)
})

var change_data=false
new_data_button.addEventListener('click',()=>{change_data=true})

var button_ctrl=true
function animate(){
    requestAnimationFrame(animate)
    c.init()
    c.rect(0,0,c.width,c.height,0,'lightblue')
    // write from here
    
    if (showGridsEmt.checked){create_Grid()}
    if (change_data){
        change_data=false
        data = new Data(numberofdatapointsEmt.value, c)
    }
    if (regressorEmt.checked){
        regressor.regress(data)
    }
    if (showError.checked){
        regressor.show_errors(data)
    }  
    data.draw()
    if (c.mouse_btn==0 && button_ctrl){
        if (c.mouse[0]>0 && c.mouse[1]>0){
            button_ctrl = false
            data.X.push(c.mouse[0]-c.width*.5)
            data.Y.push(c.mouse[1]-c.height*.5)
        }
    }
    if (c.mouse_btn==-1)(
        button_ctrl=true
    )
}
animate()