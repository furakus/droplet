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
    file_input: HTMLInputElement
    constructor(props: FileSelectorProps) {
        super(props)
        this.state = {
            filelist: []
        }
    }
    handleSelect = () => {
        let filelist = []
        let files = this.file_input.files
        for (let i = 0; i < files.length; i++) {
            filelist.push(files[i])
        }
        this.setState({filelist})
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
            {x_filelist}
            {this.state.filelist.length == 0 ? (
                <div className="form-inline">
                    <button className="btn btn-primary" onClick={() => this.file_input.click()}>Select files</button>
                    <span className="ml-2">or drag and drop them to upload</span>
                    <input type="file" hidden multiple ref={(input) => this.file_input = input} onChange = {this.handleSelect} />
                </div>
            ) : (
                <div>
                    <button className="btn btn-primary" onClick={() => this.props.onSelect(this.state.filelist)}>Upload</button>
                    <button className="btn ml-2" onClick={() => this.setState({filelist: []})}>Cancel</button>
                </div>
            )}
        </div>)
    }
}
