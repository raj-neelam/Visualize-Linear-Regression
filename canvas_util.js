export class Canvas {
    constructor(width_prop=0, height_prop=0) {
        this.canvas = document.querySelector("canvas")

        if (width_prop==0 && height_prop==0){
            this.canvas.width = this.canvas.width;
            this.canvas.height = this.canvas.height;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
        }else{
        this.width_prop = width_prop
        this.height_prop = height_prop
        this.width = window.innerWidth * width_prop;
        this.height = window.innerHeight * height_prop;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        }
        this.mouse = [0,0]
        this.mouse_btn = -1
        this.ctx = this.canvas.getContext("2d")

        window.addEventListener("mousemove", this.update_mouse.bind(this))
        window.addEventListener("mousedown", this.update_mouse_btn.bind(this))
        window.addEventListener("mouseup", this.update_mouse_btn_up.bind(this))
        window.addEventListener("resize", this.update_display.bind(this))
    }
    init() {
        this.ctx.clearRect(0,0,this.width,this.height)
    }
    update_mouse_btn_up(event){ this.mouse_btn = -1}
    update_mouse_btn(event){ this.mouse_btn = event.button}
    update_mouse(event){
        this.mouse[0] = (event.x)-(window.innerWidth-this.width)
        this.mouse[1] = (event.y)-(window.innerHeight-this.height)
    }
    update_display(event){
        this.width = window.innerWidth * this.width_prop;
        this.height = window.innerHeight * this.height_prop;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    rect(x, y, width, height, weight = 0, color = "black") {
        if (weight === 0) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, width, height);
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = weight;
            this.ctx.strokeRect(x, y, width, height);
        }
    }
    line(x, y, x1, y1, weight = 1, color = "black") {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = weight;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }
    circle(x, y, radius, weight = 0, color = "black") {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = weight;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (weight === 0) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }
}

/*

import { Canvas } from './canvas_util.js';

var c = new Canvas(0.7999, 0.896)

function animate(){
    requestAnimationFrame(animate)
    c.init()
    // write from here

}
animate()

*/