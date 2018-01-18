import * as React from 'react';

export interface AppProps {
    compiler: string
    framework: string
}

export class App extends React.Component<AppProps, {}> {
    render() {
        return (
            <div className="container">
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <a className="navbar-brand" href="#">Droplet</a>
                </nav>
                <div className="row">
                    <div className="col-sm">
                        aaaa
                    </div>
                    <div className="col-sm">
                        bbbb
                    </div>
                </div>
            </div>
        )
    }
}