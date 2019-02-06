import * as React from 'react';
import { CSSProperties } from 'react';
import * as ReactDOM from 'react-dom';
import * as Color from 'color';

import {
    remap,
    Point,
    Path,
} from './core';

let pointToScreen = (res : number, origin : Point, radius : number, point : Point) : Point => {
    return new Point(
        remap(point.x, origin.x - radius, origin.x + radius, 0, res-1),
        remap(point.y, origin.y + radius, origin.y - radius, 0, res-1)
    );
}

//================================================================================

interface PlotVisProps extends React.Props<any> {
    paths : Path[];
    origin : Point;
    radius : number;
    res : number;
    strokeWidth : number;
    stroke : string;
    fill : string;
    style? : CSSProperties;
}
interface PlotVisState {
}
export class PlotVis extends React.Component<PlotVisProps, PlotVisState> {
    constructor(props : PlotVisProps) {
        super(props);
        this.state = {};
    }
    pointsToSvgPath(points : Point[]) : string {
        let pixels = points.map(point => pointToScreen(this.props.res, this.props.origin, this.props.radius, point));
        let result = 'M' + pixels.map(p => '' + p.x + ' ' + p.y).join(' L ');
        return result;
    }
    render() {
        return (
            <svg style={this.props.style}
                width={this.props.res}
                height={this.props.res}
                >
                    <rect width={this.props.res} height={this.props.res} fill={this.props.fill} />
                    {this.props.paths.map((path, ii) => {
                        return <path
                            key={'p'+ii}
                            d={this.pointsToSvgPath(path)}
                            stroke={Color(this.props.stroke).lighten(Math.random() * 0.4).toString()}
                            strokeWidth={this.props.strokeWidth}
                            fill="transparent"
                            />;
                    })}
            </svg>
        );
    }
}
