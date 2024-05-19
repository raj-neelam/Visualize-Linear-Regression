import { Canvas } from './canvas_util.js';
import { Data } from './data.js';
import { Regressor } from './regressor_util.js';

var c = new Canvas(0.754, 0.886)

function getFromId(id){
    return document.getElementById(id);
}

// div
var epoch_tab = getFromId('epoch_tab')
var learning_tab = getFromId('learning_tab')

// slider
var numberofdatapointsEmt = getFromId("numberOfDataPoints")
var total_epoches_num = getFromId("total_epoches")
var learning_Rate = getFromId("learning_Rate")
var val_m = getFromId("val_m")
var val_b = getFromId("val_b")

// viwew
var datapoints_number = getFromId("numberOfDataPointsView")
var total_epoches_view = getFromId("total_epoches_show")
var current_epoch = getFromId("current_epoch")
var learning_Rate_view = getFromId("learning_rate_show")
var val_m_show = getFromId("val_m_show")
var val_b_show = getFromId("val_b_show")
// seting Default view
total_epoches_view.textContent = 'Total Epoches : ' + total_epoches_num.value
learning_Rate_view.textContent = 'learning Rate : ' + learning_Rate.value
val_m_show.textContent = 'value of m : '+ val_m.value
val_b_show.textContent = 'value of b : '+ val_b.value
current_epoch.textContent = 'Current Epoch : 0'

// buttons
var new_data_button = getFromId("newData")
var regressorEmt = getFromId("regress")
var regress_gradient = getFromId("regress_gradient")
var change_data=false
var regress=false
new_data_button.addEventListener('click',()=>{change_data=true})
regressorEmt.addEventListener('click',()=>{regress=true})
regress_gradient.addEventListener('click',()=>{regress=true})

// checkboxes
var showGridsEmt = getFromId("show_grid")
var showError = getFromId("distance")
showGridsEmt.checked=true
showError.checked=false

// select
var regression_mode_value = ''
var regresion_mode = getFromId('regresion_mode')
regresion_mode.addEventListener('input',mode_selector)
mode_selector()


document.addEventListener('contextmenu', event => event.preventDefault());

datapoints_number.textContent = numberofdatapointsEmt.value

var data = new Data(numberofdatapointsEmt.value,c)
var regressor = new Regressor(regression_mode_value, c)

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
function mode_selector(){
    // to-do change
    if (regresion_mode.value==="OLS"){
        regression_mode_value='OLS'
        // in OLS MODE
        console.log("ols_MODE")
        // showing
        regressorEmt.style.display = 'block'

        // hiding
        epoch_tab.style.display = 'none'
        learning_tab.style.display = 'none'
        regress_gradient.style.display = 'none'
    }
    else if (regresion_mode.value==="BGD"){
        regression_mode_value='BGD'
        // in BGD MODE
        console.log("BGD_MODE")
        // showing
        epoch_tab.style.display = 'block'
        learning_tab.style.display = 'block'
        regress_gradient.style.display = 'block'

        // hiding
        regressorEmt.style.display = 'none'

    }
    else if(regresion_mode.value==='SGD'){
        regression_mode_value='SGD'
        //in SGD MODE
        console.log('SGD_MODE')
        // showing
        learning_tab.style.display = 'block'
        regress_gradient.style.display = 'block'
        //hiding
        epoch_tab.style.display = 'none'
        regressorEmt.style.display = 'none'
    }
    else{
        // in Polynomial MODE
        console.log("polynomial mode")
    }
    regressor = new Regressor(regression_mode_value, c, learning_Rate.value)
}

numberofdatapointsEmt.addEventListener("input", ()=>{
    datapoints_number.textContent = numberofdatapointsEmt.value
    var new_num = numberofdatapointsEmt.value
    data.trim(new_num)
})
val_m.addEventListener('input', ()=>{
    val_m_show.textContent = 'value of m : ' + val_m.value
    regressor.m = +val_m.value
})
val_b.addEventListener('input', ()=>{
    val_b_show.textContent = 'value of b : ' + val_b.value
    regressor.b = +val_b.value
})
total_epoches_num.addEventListener('input', ()=>{
    total_epoches_view.textContent ='Total Epoches : ' + total_epoches_num.value
})
learning_Rate.addEventListener('input',()=>{
    learning_Rate_view.textContent = 'learning Rate : ' + learning_Rate.value
})

var button_ctrl=true
function animate(){
    requestAnimationFrame(animate)
    c.init()
    c.rect(0,0,c.width,c.height,0,'rgb(177, 197, 207)')
    // write from here
    if (showGridsEmt.checked){create_Grid()}

    if (change_data){
        change_data=false
        data = new Data(numberofdatapointsEmt.value, c)
    }

    if (regress){
        var step = regressor.regress(data, total_epoches_num.value)
        current_epoch.textContent = 'Current Epoch : ' + regressor.step
        if (step>=total_epoches_num.value){
            regress=false
            regressor.step=0
        }

        val_m.value = regressor.m.toFixed(2)
        val_m_show.textContent = 'value of m : ' + regressor.m.toFixed(2)
        val_b.value = regressor.b.toFixed(2)
        val_b_show.textContent = 'value of b : ' + regressor.b.toFixed(2)
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