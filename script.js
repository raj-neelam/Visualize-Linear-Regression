import { Canvas } from './canvas_util.js';
import { Data } from './regressor_util.js';
import { Regressor } from './regressor_util.js';

var c = new Canvas(0.793, 0.886)

function getFromId(id){
    return document.getElementById(id);
}

// slider
var numberofdatapointsEmt = getFromId("numberOfDataPoints")
var val_m = getFromId("val_m")
var val_b = getFromId("val_b")

// viwew
var datapoints_number = getFromId("numberOfDataPointsView")
var val_m_show = getFromId("val_m_show")
var val_b_show = getFromId("val_b_show")

// buttons
var new_data_button = getFromId("newData")
var regressorEmt = getFromId("regress")
var change_data=false
var regress=false
new_data_button.addEventListener('click',()=>{change_data=true})
regressorEmt.addEventListener('click',()=>{regress=true})

// checkboxes
var showGridsEmt = getFromId("show_grid")
var showError = getFromId("distance")
showGridsEmt.checked=true
showError.checked=false

document.addEventListener('contextmenu', event => event.preventDefault());

// regressorEmt.checked=true
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

val_m.addEventListener('input', ()=>{
    val_m_show.textContent = val_m.value
    regressor.m = val_m.value
})
val_b.addEventListener('input', ()=>{
    val_b_show.textContent = val_b.value
    regressor.b = val_b.value
    console.log(val_b.value)
})



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
    if (regress){
        regressor.regress(data)
        // val_m.value = regressor.m
        // val_m_show = regressor.m
        // val_b.value = regressor.b
        // val_b_show = regressor.b
        regress=false
    }
    if (showError.checked){
        regressor.show_errors(data)
    }  
    data.draw()
    regressor.draw_line()

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