import * as React from 'react'

export interface UploaderProps {
    compiler: string
    framework: string
    file: { name: string, blob: Blob }
}

enum Stage {
    Request
}

interface UploaderStates {
    stage: Stage
}

export class Uploader extends React.Component<UploaderProps, UploaderStates> {
    constructor(props: UploaderProps) {
        super(props)
        this.state = {
            stage: Stage.Request
        }
    }
    componentDidMount() {

    }
    componentWillUnmount() {
        
    }
    render() {
        return (<div></div>)
    }
}