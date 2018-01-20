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
    zipfile: JSZip
    constructor(props: FileCompressorProps) {
        super(props)
        this.state = {
            progress: 0
        }
        this.zipfile = new JSZip()
        for (let file of this.props.filelist) {
            this.zipfile.file(file.name, file)
        }
        this.zipfile.generateAsync({type: 'blob'}, this.onProgress).then(this.props.onDone)
    }
    onProgress = (metadata: {percent: number}) => {
        this.setState({progress: metadata.percent})
    }
    render() {
        return (<div className="col-md-8 col-lg-6">
            <span className="mb-2">Compressing</span>
            <div className="progress mb-2">
                <div className="progress-bar" style={{width: `${this.state.progress}%`}} role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <button className="btn">Cancel</button>
        </div>)
    }
}