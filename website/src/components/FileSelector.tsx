import * as React from 'react'

export interface FileSelectorProps {
    compiler: string
    framework: string
    onSelect: (filelist: File[]) => void
}

interface FileSelectorStates {
    filelist: File[]
}

export class FileSelector extends React.Component<FileSelectorProps, FileSelectorStates> {
    file_input: HTMLInputElement | null = null
    constructor(props: FileSelectorProps) {
        super(props)
        this.state = {
            filelist: []
        }
    }
    componentDidMount() {
        let e_app = document
        e_app.addEventListener('dragover', this.handleDragFile)
        e_app.addEventListener('drop', this.handleDropFile)
    }
    componentWillUnmount() {
        let e_app = document
        e_app.removeEventListener('dragover', this.handleDragFile)
        e_app.removeEventListener('drop', this.handleDropFile)
    }
    handleDialog = () => {
        if (this.file_input !== null) {
            this.file_input.click()
        }
    }
    handleSelect = () => {
        if (this.file_input !== null) {
            let files = this.file_input.files
            if (files !== null) {
                let filelist = []
                for (let i = 0; i < files.length; i++) {
                    filelist.push(files[i])
                }
                this.setState({filelist})
            }
        }
    }
    handleDragFile = (evt: DragEvent) => {
        evt.preventDefault()
        if (evt.dataTransfer !== null) {
            evt.dataTransfer.dropEffect = 'copy'
        }
    }
    handleDropFile = (evt: DragEvent) => {
        evt.preventDefault()
        if (evt.dataTransfer === null) {
            return
        }
        let filelist = []
        let files = evt.dataTransfer.files
        for (let i = 0; i < files.length; i++) {
            filelist.push(files[i])
        }
        this.setState({filelist})
    }
    handleCancel = () => {
        if (this.file_input !== null) {
            this.file_input.value = ''
        }
        this.setState({filelist: []})
    }
    render() {
         let x_filelist = this.state.filelist.map((file) => {
            let size = file.size
            let size_text: string
            if (size >= 1024 * 1024 * 1024) {
                size_text = `${(size / (1024 * 1024 * 1024)).toFixed(1)}G`
            } else if (size >= 1024 * 1024) {
                size_text = `${(size / (1024 * 1024)).toFixed(1)}M`
            } else if (size >= 1024) {
                size_text = `${(size / 1024).toFixed(1)}K`
            } else {
                size_text = `${size}B`
            }
            return (<div className="input-group mb-2">
                <div className="input-group-prepend">
                    <span className="input-group-text">File</span>
                </div>
                <input className="form-control" type="text" readOnly value={file.name} />
                <div className="input-group-append">
                    <span className="input-group-text">{size_text}</span>
                </div>
            </div>)
        })
        return (<div className="col-md-8 col-lg-6">
            {this.state.filelist.length == 0 ? (
                <div className="alert alert-warning mb-2">
                    <p>Droplet works like a network pipe. Each link only offers <strong>one-time</strong> downloading. <a className="alert-link" href="https://github.com/furakus/droplet/blob/master/README.md">Learn more</a></p>
                    <hr/>
                    <p className="mb-0">Remember: You only have OneShot</p>
                </div>
            ) : (
                <div className="alert alert-warning mb-2">
                    Multiple files can be uploaded at once. Droplet will pack them.
                </div>
            )}
            {x_filelist}
            {this.state.filelist.length == 0 ? (
                <div className="form-inline mt-4">
                    <button className="btn btn-primary" onClick={this.handleDialog}>Select files</button>
                    <span className="ml-2">or drag them to upload</span>
                </div>
            ) : (
                <div className="mt-4">
                    <button className="btn btn-primary" onClick={() => this.props.onSelect(this.state.filelist)}>Upload</button>
                    <button className="btn btn-warning ml-2" onClick={this.handleDialog}>Change</button>
                    <button className="btn ml-2" onClick={this.handleCancel}>Cancel</button>
                </div>
            )}
            <input type="file" hidden multiple ref={(input) => this.file_input = input} onChange = {this.handleSelect} />
        </div>)
    }
}
