import * as React from 'react'
import * as JSZip from 'jszip'

export interface FileCompressorProps {
    compiler: string
    framework: string
    filelist: File[]
    onDone: (blob: Blob) => void
    onCancel: () => void
}

interface FileCompressorState {
    progress: number
}

export class FileCompressor extends React.Component<FileCompressorProps, FileCompressorState> {
    cancel_callback: () => void
    constructor(props: FileCompressorProps) {
        super(props)
        this.state = {
            progress: 0
        }
    }
    componentWillMount() {
        let zipfile = new JSZip()
        for (let file of this.props.filelist) {
            zipfile.file(file.name, file)
        }
        new Promise<Blob>((resolve, reject) => {
            this.cancel_callback = reject
            zipfile.generateAsync({type: 'blob'}, this.onProgress).then(resolve)
        }).then(this.props.onDone).catch(() => {})
    }
    componentWillUnmount() {
        this.cancel_callback()
    }
    onCancel = () => {
        this.cancel_callback()
        this.props.onCancel()
    }
    onProgress = (metadata: {percent: number, currentFile: string}) => {
        this.setState({progress: metadata.percent})
    }
    render() {
        return (<div className="col-md-8 col-lg-6">
            <div className="progress mb-2">
                <div className="progress-bar" style={{width: `${this.state.progress}%`}} role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <button className="btn" onClick={this.onCancel}>Cancel</button>
        </div>)
    }
}