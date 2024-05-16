export class Data{
    constructor(n,c){

        this.c = c
        this.randomness = 100
        this.m =  2 * (Math.random() * 2-1)
        this.b = this.c.height *.25 * (Math.random() * 2-1)
        this.X = Array.from({ length: n });
        this.Y = Array.from({ length: n });

        for (let i = 0; i<n; i++){
            var inBound=false
            var x,y;
            while (!inBound) {
                x = (Math.random()*2-1)*this.c.width*.5
                y = this.m*x+this.b+(Math.random() * 2-1)*this.randomness
                if (y>-this.c.height*.5 && y<this.c.height*.5){
                    inBound=true
                }
            }
            this.X[i] = x
            this.Y[i] = y
        }

        this.x_offset = this.c.width*.5
        this.y_offset = this.c.height*.5
    }       
    draw(){
        for (var i=0; i<this.X.length; i++){
            this.c.circle(this.X[i]+this.x_offset,this.Y[i]+this.y_offset,4, 0, 'blue')
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
                    x = (Math.random()*2-1)*this.c.width*.5
                    y = this.m*x+this.b+(Math.random() * 2-1)*this.randomness
                    if (y>-this.c.height*.5 && y<this.c.height*.5){
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

export class Regressor{
    constructor(c){
        this.c = c
        this.m=(Math.random() * 2-1) * 2
        this.b=(Math.random() * 2-1) * 100
    }
    regress(data, c){
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
        this.m = num/den
        this.b = y_mean - this.m*x_mean

        
    }
    show_errors(data){
        for (let i=0;i<data.X.length;i++){
            var x1 = data.X[i]
            var y1 = data.Y[i]
            var x2 = data.X[i]
            var y2 = this.m*data.X[i]+this.b
            this.c.line(x1+this.c.width*.5,y1+this.c.height*.5,x2+this.c.width*.5,y2+this.c.height*.5,1, 'red')
        }
    }
    draw_line(){
        var x = this.c.width*.5
        var y = this.c.height*.5
        var x1 = -x
        var y1 = (this.m*(-x)+this.b)
        var x2 = x
        var y2 = (this.m*(x)+this.b)
        // console.log(x1,y1,x2,y2)
        this.c.line(x1+x, y1+y, x2+x, y2+y, 3, 'green')
    }

}