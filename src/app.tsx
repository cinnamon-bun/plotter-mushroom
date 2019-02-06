import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {
    Brush,
    ORIGIN,
    Path,
    Point,
    detRandom,
    posMod,
    range,
    remap,
} from './core';
import { PlotVis } from './plotvis';

//================================================================================


let makeMushroom = () : Path[] => {
    /*
    // sand dollar / mushroom
    let initialNumSeeds = 9;
    let splitAt = 0.06;
    let minRad = 0.05;
    let maxRad = 1;
    let radStep = 0.005;
    let skipIter = 3;
    let damp = 0.8;  // 0 is no dampening, 1 is totally damp
    let seed = 9;
    let jitter = 0.03;  // safe range 0 to 1
    let splitJitter = 0.0001;
    let wind = 0;
    let gravity = 0;
    let twist = 0;
    */

    /*
    // earthquake
    let initialNumSeeds = 9;
    let splitAt = 0.05;
    let minRad = 0.05;
    let maxRad = 1;
    let radStep = 0.005;
    let skipIter = 3;
    let damp = 0.03;  // 0 is no dampening, 1 is totally damp
    let seed = 9;
    let jitter = 0.03;  // safe range 0 to 1
    let splitJitter = 0.0001;
    let wind = 0;
    let gravity = 0;
    let twist = 0;
    */

    // the wave
    let initialNumSeeds = 9;
    let splitAt = 0.05;
    let minRad = 0.05;
    let maxRad = 1;
    let radStep = 0.005;
    let skipIter = 3;
    let damp = 0.85;  // 0 is no dampening, 1 is totally damp
    let seed = 9;
    let jitter = 0.1;  // safe range 0 to 1
    let splitJitter = 0.0001;
    let wind = 0.003;
    let gravity = 0.003;
    let twist = 0.4;

    let brushes : Brush[] = range(initialNumSeeds).map(ii => {
        let rand = remap(detRandom('circlejitter-' + ii + '-' + seed), 0, 1, -0.4, 0.4);
        return new Point(
            Math.sin((ii + rand) / initialNumSeeds * 2 * Math.PI),
            Math.cos((ii + rand) / initialNumSeeds * 2 * Math.PI),
        ).toBrush()
    });
    let rad = 0.0001;
    let paths = {};
    let iter = 0;
    //brushes.forEach(b => b.stamp());
    for (let rad = minRad; rad < maxRad; rad += radStep) {
        // smooth
        let oldPoints = brushes.map(brush => brush.clone());
        let iiToSplit : number[] = [];
        for (let ii = 0; ii < oldPoints.length; ii++) {
            let prevPoint = oldPoints[posMod(ii - 1, brushes.length)];
            let thisBrush = brushes[ii];
            let nextPoint = oldPoints[posMod(ii + 1, brushes.length)];

            let jitterMix = remap(detRandom('jittermix-' + ii + '-' + rad + '-' + seed), 0, 1, 0.5 - jitter/2, 0.5 + jitter/2);
            jitterMix += twist;
            let newPoint =
                thisBrush.mulFloat(damp)
                .addPoint(prevPoint.mulFloat((1 - damp) * (jitterMix)))
                .addPoint(nextPoint.mulFloat((1 - damp) * (1 - jitterMix)))
                .addPoint(new Point(wind, -gravity));
            thisBrush.move(newPoint);

            let space = Math.min(thisBrush.distTo(prevPoint), thisBrush.distTo(nextPoint));
            if (space > splitAt) {
                iiToSplit.push(ii);
            }
        }

        // split
        let brushesWithSplits : Brush[] = [];
        for (let ii = 0; ii < brushes.length; ii++) {
            brushesWithSplits.push(brushes[ii]);
            if (iiToSplit.indexOf(ii) !== -1) {
                let splitJitterP = Point.detRandomInCircle('splitjitter-' + ii + '-' + seed).mulFloat(splitJitter);
                brushesWithSplits.push(brushes[ii].addPoint(splitJitterP).toBrush());
            }
        }
        brushes = brushesWithSplits

        // normalize to new radius
        for (let brush of brushes) {
            brush.move(brush.normalized().mulFloat(rad));
        }

        // stamp
        if (iter > skipIter) {
            for (let brush of brushes) {
                brush.stamp();
            }
        }
        iter += 1;
    }
    //brushes.forEach(b => b.stamp());
    //brushes.forEach(b => b.move(b.addFloat(0.01)));
    brushes.forEach(b => b.stamp());
    return brushes.map(brush => brush.history || []);
}

let paths = makeMushroom();
console.log(paths);

//================================================================================

ReactDOM.render(
    <div style={{textAlign: 'center'}}>
        <PlotVis
            paths={paths}
            origin={ORIGIN}
            radius={1.2}
            res={1000}
            strokeWidth={3}
            stroke="#234"
            fill="transparent"
            />
    </div>,
    document.getElementById('react-slot')
);

/*
    paths : Path[];
    origin : Point;
    radius : number;
    res : number;
    strokeWidth : number;
    stroke : string;
    fill : string;
    style? : CSSProperties;
*/