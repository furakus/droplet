import * as React from 'react'
import { FileSelector } from './FileSelector'
import { FileCompressor } from './FileCompressor'

export interface AppProps {
    compiler: string
    framework: string
}

enum Stage {
    Selecting,
    Compressing,
    Uploading,
}

interface AppState {
    stage: Stage
}

export class App extends React.Component<AppProps, AppState> {
    filelist: File[]
    blob: Blob
    constructor(props: AppProps) {
        super(props)
        this.state = {
            stage: Stage.Selecting
        }
    } 
    handleSelect = (filelist: File[]) => {
        this.filelist = filelist
        if (this.filelist.length == 1) {
            this.blob = this.filelist[0]
            this.setState({stage: Stage.Uploading})
        } else if (this.filelist.length > 1) {
            this.setState({stage: Stage.Compressing})
        }
    }
    handleCompressed = (blob: Blob) => {
        this.blob = blob
        this.setState({stage: Stage.Uploading})
    }
    render() {
        let x_stage: JSX.Element
        if (this.state.stage == Stage.Selecting) {
            x_stage = (<FileSelector compiler="TypeScript" framework='React' onSelect={this.handleSelect} />)
        } else if (this.state.stage == Stage.Compressing) {
            x_stage = (<FileCompressor compiler="TypeScript" framework='React' filelist={this.filelist} onDone={this.handleCompressed} onCancel={() => this.setState({stage: Stage.Selecting})} />)
        } else if (this.state.stage == Stage.Uploading) {
            x_stage = (<div>aaaa</div>)
        }
        return (<div className="container">
            <nav className="navbar navbar-expand-lg navbar-light bg-light  mb-4">
                <a className="navbar-brand" href="#">Droplet</a>
            </nav>
            <div className="row justify-content-center">{x_stage}</div>
        </div>)
    }
}
