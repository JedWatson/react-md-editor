// Import React and other dependencies
import React, { Component } from "react";
import PropTypes from "prop-types";
import Editor from "react-md-editor";
import marked from "marked";

// Define a new React component
class App extends Component {
	// Define the PropTypes for the component
	static propTypes = {
		code: PropTypes.string.isRequired,
	};

	// Define the initial state of the component
	state = {
		code: this.props.code,
	};

	// Define a function to update the state when the editor content changes
	updateCode = (newCode) => {
		this.setState({ code: newCode });
	};

	// Render the component
	render() {
		// Extract the current state of the component
		const { code } = this.state;

		// Use marked to convert the markdown content to HTML
		const preview = marked(code);

		// Render the component
		return (
			<div className="example">
				<div className="hint">
					The editor is below, with default options. This example also uses
					marked to generate the preview on the right as you type.
				</div>
				// Render the Markdown editor component
				<div className="editor">
					<Editor value={code} onChange={this.updateCode} />
				</div>
				{/* Render the preview of the markdown content */}
				<div
					className="preview"
					dangerouslySetInnerHTML={{ __html: preview }}
				/>
			</div>
		);
	}
}

// Render the App component and mount it to the DOM
ReactDOM.render(
	<App
		code="# React Markdown Editor

* A list

Some **bold** and _italic_ text

> A quote...

By [Jed Watson](https://github.com/JedWatson) and [Joss Mackison)"
	/>,
	document.getElementById("app")
);
