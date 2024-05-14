import { Canvas } from './canvas_util.js';

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

class Data{
    constructor(n){

        this.randomness = 100

        this.m =  2 * (Math.random() * 2-1)
        this.b = c.height*.25 * (Math.random() * 2-1)

        this.X = Array.from({ length: n });
        this.Y = Array.from({ length: n });

        for (let i = 0; i<n; i++){
            var inBound=false
            var x,y;
            while (!inBound) {
                x = (Math.random()*2-1)*c.width*.5
                y = this.m*x+this.b+(Math.random() * 2-1)*this.randomness
                if (y>-c.height*.5 && y<c.height*.5){
                    inBound=true
                }
            }
            this.X[i] = x
            this.Y[i] = y
        }

        this.x_offset = c.width*.5
        this.y_offset = c.height*.5
    }       
    draw(){
        for (var i=0; i<this.X.length; i++){
            c.circle(this.X[i]+this.x_offset,this.Y[i]+this.y_offset,4, 0, 'blue')
        }
    }
    trim(n){
        if (n>this.X.length){
            var Xn = Array.from({ length: n })
            var Yn = Array.from({ length: n })

            for (let i = 0; i<this.X.length;i++){
                Xn[i] = this.X[i]
                Yn[i] = this.Y[i]
            }

            for (let i = this.X.length; i<n;i++){
                var inBound=false
                var x,y;
                while (!inBound) {
                    x = (Math.random()*2-1)*c.width*.5
                    y = this.m*x+this.b+(Math.random() * 2-1)*this.randomness
                    if (y>-c.height*.5 && y<c.height*.5){
                        inBound=true
                    }
                }

                Xn[i] = x
                Yn[i] = y
            }
            this.X = Xn
            this.Y = Yn
        }else{
            var Xn = Array.from({ length: n })
            var Yn = Array.from({ length: n })

            for (let i = 0; i<n;i++){
                Xn[i] = this.X[i]
                Yn[i] = this.Y[i]
            }
            
            this.X = Xn
            this.Y = Yn
        }
    }
}

var data = new Data(numberofdatapointsEmt.value)


numberofdatapointsEmt.addEventListener("input", ()=>{
    datapoints_number.textContent = numberofdatapointsEmt.value
    var new_num = numberofdatapointsEmt.value
    data.trim(new_num)
})

var change_data=false
new_data_button.addEventListener('click',()=>{change_data=true})

var m=0
var b=0
var button_ctrl=true
function animate(){
    requestAnimationFrame(animate)
    c.init()
    c.rect(0,0,c.width,c.height,0,'lightblue')
    // write from here
    if (showGridsEmt.checked){create_Grid()}
    if (change_data){
        change_data=false
        data = new Data(numberofdatapointsEmt.value)
    }
    if (regressorEmt.checked){
        var sum = 0
        var sum2 = 0
        for (let i=0; i<data.X.length; i++){
            sum+=data.X[i]
            sum2+=data.Y[i]
        }
        var x_mean = sum/data.X.length
        var y_mean = sum2/data.Y.length

        var num = 0
        var den = 0
        for (let i=0; i<data.X.length; i++){
            num+=(data.X[i]-x_mean)*(data.Y[i]-y_mean)
            den+=(data.X[i]-x_mean)*(data.X[i]-x_mean)
        }
        m = num/den
        b = y_mean - m*x_mean

        var x = c.width*.5
        var y = c.height*.5
        var x1 = -x
        var y1 = (m*(-x)+b)
        var x2 = x
        var y2 = (m*(x)+b)
        c.line(x1+x, y1+y, x2+x, y2+y, 3, 'green')
    }
    if (showError.checked){
        for (let i=0;i<data.X.length;i++){
            var x1 = data.X[i]
            var y1 = data.Y[i]
            var x2 = data.X[i]
            var y2 = m*data.X[i]+b
            c.line(x1+c.width*.5,y1+c.height*.5,x2+c.width*.5,y2+c.height*.5,1, 'red')
        }
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