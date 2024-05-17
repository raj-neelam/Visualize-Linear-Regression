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
