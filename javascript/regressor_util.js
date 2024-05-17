export class Regressor {
    constructor(mode, c) {
        this.c = c
        this.m = (Math.random() * 2 - 1) * 2
        this.b = (Math.random() * 2 - 1) * 100
        this.starting_m = this.m
        this.starting_b = this.b
        this.step = 0
        this.mode = mode
    }
    regress(data, max_epoch=0) {
        if (this.mode == 'OLS') {
            var sum = 0
            var sum2 = 0
            for (let i = 0; i < data.X.length; i++) {
                sum += data.X[i]
                sum2 += data.Y[i]
            }
            var x_mean = sum / data.X.length
            var y_mean = sum2 / data.Y.length

            var num = 0
            var den = 0
            for (let i = 0; i < data.X.length; i++) {
                num += (data.X[i] - x_mean) * (data.Y[i] - y_mean)
                den += (data.X[i] - x_mean) * (data.X[i] - x_mean)
            }
            this.m = num / den
            this.b = y_mean - this.m * x_mean
        }
        else if (this.mode == 'SGD'){
            // to regress
            this.step += 1
            // if (this.step>=this.max_epoch)
        }

    }
    loss(data){
        var sumer = 0
        for (let i=0; i<data.X.length;i++){
            sumer += data.Y[i]-(this.m*data.X[i]+this.b)*(this.m*data.X[i]+this.b)
        }
        return sumer/data.X.length
    }

    show_errors(data) {
        for (let i = 0; i < data.X.length; i++) {
            var x1 = data.X[i]
            var y1 = data.Y[i]
            var x2 = data.X[i]
            var y2 = this.m * data.X[i] + this.b
            this.c.line(x1 + this.c.width * .5, y1 + this.c.height * .5, x2 + this.c.width * .5, y2 + this.c.height * .5, 1, 'red')
        }
    }
    draw_line() {
        var x = this.c.width * .5
        var y = this.c.height * .5
        var x1 = -x
        var y1 = (this.m * (-x) + this.b)
        var x2 = x
        var y2 = (this.m * (x) + this.b)
        // console.log(x1,y1,x2,y2)
        this.c.line(x1 + x, y1 + y, x2 + x, y2 + y, 3, 'green')
    }

}

