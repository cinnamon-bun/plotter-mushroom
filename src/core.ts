import * as md5 from 'md5';
import * as Color from 'color';

//================================================================================

export let range = (x : number) : number[] => {
    let result = [];
    for (let n = 0; n < x; n++) {
        result.push(n);
    }
    return result;
}

export let posMod = (x : number, m : number) : number =>
    ((x % m) + m) % m;

export let detRandom = (s : string) : number => {
    // return random-ish float between 0 and 1, deterministically derived from a hash of the string
    let m = md5(s) as string;
    return parseInt(m.slice(0, 16), 16) / parseInt('ffffffffffffffff', 16);
};

export let detChoose = <T extends {}>(s : string, arr : T[]) : T =>
    // deterministically choose a random-ish item from an array based on the value of s
    arr[Math.floor(detRandom(s) * arr.length)];

export let remap = (x : number, oldMin : number, oldMax : number, newMin : number, newMax : number) => {
    let ii = (x - oldMin) / (oldMax - oldMin);
    return ii * (newMax - newMin) + newMin;
};

export let clamp = (x : number, minn : number, maxx : number) =>
    Math.max(minn, Math.min(maxx, x));

export let remapAndClamp = (x : number, oldMin : number, oldMax : number, newMin : number, newMax : number) =>
    clamp(remap(x, oldMin, oldMax, newMin, newMax), newMin, newMax);

export let mySin = (x : number, period : number, phase : number, minn : number, maxx : number) : number =>
    remap(Math.sin((x / period - phase) * Math.PI * 2), -1, 1, minn, maxx);

export let linterp = (v0 : number, v1 : number, blend : number) : number =>
    (1 - blend) * v0 + blend * v1;

export let sinterp = (v0 : number, v1 : number, blend : number) : number =>
    remap(Math.cos(blend * Math.PI), 1, -1, v0, v1);

export let sawtooth = (x : number) : number =>
    posMod(x, 1);

export let sign = (x : number) : number =>
    x >= 0 ? 1 : -1;

export let findZero = (v0 : number, v1 : number) : number => {
    // given a line passing through the points (0, v0) and (1, v1), return the x-coord of the point where y crosses zero.
    // output will be between 0 and 1 inclusive.
    // v0 and v1 must have different signs.  Otherwise this will throw an error.
    if (sign(v0) === sign(v1)) {
        throw "findZero sign problem";
    }
    return (-v0) / (v1 - v0);
}

export let myPow = (x : number, p : number) : number =>
    (x > 0)
    ? Math.pow(x, p)
    : -Math.pow(-x, p);

//================================================================================

export type TransformFn = (p : Point) => Point;
export type FieldFn = (p : Point) => number;
export type FloatFn = (n : number) => number;

export let slide = (x : number, y : number) : TransformFn =>
    (p : Point) : Point =>
        new Point(p.x - x, p.y - y);

export let scaleUniform = (s : number, origin? : Point) : TransformFn =>
    (p : Point) : Point =>
        origin
        ? p.subPoint(origin).divFloat(s).addPoint(origin)
        : p.divFloat(s);

export let scaleXY = (sx : number, sy : number, origin? : Point) : TransformFn =>
    (p : Point) : Point =>
        origin
        ? p.subPoint(origin).divPoint(new Point(sx, sy)).addPoint(origin)
        : p.divPoint(new Point(sx, sy));

export class Point {
    x : number;
    y : number;
    constructor(x : number, y : number) {
        this.x = x;
        this.y = y;
    }
    clone() : Point { return new Point(this.x, this.y); } // note: does not clone history
    addPoint(p2 : Point) { return new Point(this.x + p2.x, this.y + p2.y); }
    subPoint(p2 : Point) { return new Point(this.x - p2.x, this.y - p2.y); }
    mulPoint(p2 : Point) { return new Point(this.x * p2.x, this.y * p2.y); }
    divPoint(p2 : Point) { return new Point(this.x / p2.x, this.y / p2.y); }

    addFloat(n : number) { return new Point(this.x + n, this.y + n); }
    subFloat(n : number) { return new Point(this.x - n, this.y - n); }
    mulFloat(n : number) { return new Point(this.x * n, this.y * n); }
    divFloat(n : number) { return new Point(this.x / n, this.y / n); }

    transform(tr : TransformFn) { return tr(this); }

    len() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalized() {
        if (this.x === 0 && this.y === 0) { return this; }
        return this.divFloat(this.len());
    }
    distTo(p2 : Point) { return this.subPoint(p2).len(); }

    mix(p2 : Point, pct : number) { return this.mulFloat(1-pct).addPoint(p2.mulFloat(pct)); }

    static detRandomInSquare(seed : string) : Point {
        return new Point(detRandom(seed)*2-1, detRandom(seed + 'zzz')*2-1);
    }
    static detRandomInCircle(seed : string) : Point {
        let ii = 0;
        while (true) {
            let p = Point.detRandomInSquare(seed + ii);
            if (p.len() < 1) { return p; }
            ii += 1;
        }
    }
    static detRandomOnCircle(seed : string) : Point {
        return Point.detRandomInCircle(seed).normalized();
    }
    toBrush() : Brush {
        return new Brush(this.x, this.y);
    }
}

export class Brush extends Point {
    history : Point[] | null;
    constructor(x : number, y : number) {
        super(x, y);
        this.history = null;
    }
    stamp() : void {
        if (this.history === null) { this.history = []; }
        this.history.push(this.clone());
    }
    move(newPoint : Point) : void {
        this.x = newPoint.x;
        this.y = newPoint.y;
    }
}


export type Path = Point[]

export let ORIGIN = new Point(0, 0);

/*
export class Field {
    fn : FieldFn;
    constructor(fn : FieldFn) {
        this.fn = fn;
    }
    eval(p : Point) { return this.fn(p); }

    // change input coordinates
    transform(tr : TransformFn) { return new Field((p : Point) => this.eval(tr(p))); }

    // combine with other fields
    addField(f2 : Field) { return new Field((p : Point) => this.eval(p) + f2.eval(p)); }
    subField(f2 : Field) { return new Field((p : Point) => this.eval(p) - f2.eval(p)); }
    mulField(f2 : Field) { return new Field((p : Point) => this.eval(p) * f2.eval(p)); }
    mixField(f2 : Field, mix : number) { return new Field((p : Point) => (1 - mix) * this.eval(p) + mix * f2.eval(p)); }

    // change output
    addFloat(n : number) { return new Field((p : Point) => this.eval(p) + n); }
    subFloat(n : number) { return new Field((p : Point) => this.eval(p) - n); }
    mulFloat(n : number) { return new Field((p : Point) => this.eval(p) * n); }
    divFloat(n : number) { return new Field((p : Point) => this.eval(p) / n); }
    apply(fn : FloatFn) { return new Field((p : Point) => fn(this.eval(p))); }
}

//================================================================================

export let noiseFn = (p : Point) => {
    // output range -1 to 1
    let x0 = Math.floor(p.x);
    let y0 = Math.floor(p.y);
    let x1 = x0 + 1;
    let y1 = y0 + 1;
    let xr = p.x - x0;
    let yr = p.y - y0;

    let v00 = detRandom('' + x0 + ' | ' + y0) * 2 - 1;
    let v01 = detRandom('' + x0 + ' | ' + y1) * 2 - 1;
    let v10 = detRandom('' + x1 + ' | ' + y0) * 2 - 1;
    let v11 = detRandom('' + x1 + ' | ' + y1) * 2 - 1;

    let vx0 = sinterp(v00, v01, yr);
    let vx1 = sinterp(v10, v11, yr);
    let v = sinterp(vx0, vx1, xr);

    return v;
};


export let noise = new Field(noiseFn);

export let octaveNoise = (scaleExponent : number, weightExponent : number, octaves : number) : Field => {
    // scaleExponent is fractal dimension.  1.5 is melty, 2 is normal, 3 is detailed
    // weight exponent is like smoothness.  1 is roughth, 2 is normal, 3+ is smooth
    return new Field(p => {
        let result = 0;
        let maxx = 0;
        for (let ii = 0; ii < octaves; ii++) {
            let scale = 1 / Math.pow(scaleExponent, ii);
            let weight = Math.pow(1 / weightExponent, ii);
            result += noiseFn(p.divFloat(scale)) * weight;
            maxx += weight;
        }
        return result / maxx;
    });
}

export let octaveNoise2 = (scaleExponent : number, weightExponent : number, octaves : number) : Field => {
    // output range -1 to 1
    let result = new Field(p => 0);
    let maxx = 0;
    for (let ii = 0; ii < octaves; ii++) {
        maxx += 1 / Math.pow(weightExponent, ii);
        result = result.addField(
            noise
                .transform(scaleUniform(1 / Math.pow(scaleExponent, ii)))
                .mulFloat(Math.pow(1 / weightExponent, ii))
        );
    }
    return result.mulFloat(1/maxx);
}

//================================================================================

export type ColorFn = (value : number) => string;

export let colorFns = {
    landscape: (value : number) : string => {
        let color : string;
        if (value > 0) {
            color = Color.rgb(0, 60, 0).mix(Color.rgb(255, 255, 255), value).string();
        } else {
            color = Color.rgb(50, 180, 255).mix(Color.rgb(50, 30, 150), -value).string();
        }
        return color;
    },
    topoMap: (value : number) : string => {
        let base = colorFns.landscape(value);
        let stripes = sawtooth(value * 8 + 0.1) < 0.2 ? '#888' : '#fff';
        return Color(base).mix(Color(stripes), 0.2).string();
    },
    marbled: (value : number) : string => {
        let color = '#edc';
        //return (posMod(value * 10, 1) > 0.8) ? Color(color).darken(0.3).string() : color;
        return (posMod(value * 6, 1) > 0.5) ? Color(color).darken(0.3).string() : color;
    },
};
*/