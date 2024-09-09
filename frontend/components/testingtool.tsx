import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const styles = {
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    marginBottom: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  input: {
    marginBottom: '16px',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
  },
  prevres : {
    marginBottom: '16px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
  }
};

function TestingTool() {
  const [context, setContext] = useState('');
  const [screenshots, setScreenshots] = useState<FileList | null>(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [previousMarks, setPreviousMarks] = useState([]);
  const handleContextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContext(event.target.value);
  };

  const handleScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScreenshots(event.target.files);
  };

  const handleGenerateInstructions = async () => {
    try {
      const formData = new FormData();
      formData.append('context', context);
      
      if (screenshots) {
        Array.from(screenshots).forEach(file => {
          formData.append("screenshots", file);
        });
      }
      
      console.log('Sending formData:', formData);
      
      const response = await axios.post('http://localhost:3000/generate_instructions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log(response)
      if(markdownContent){
        setPreviousMarks([markdownContent,...previousMarks])
      }
      setMarkdownContent(response.data.instructions);
    } catch (error) {
      console.error('Error in handleGenerateInstructions:', error);
      setMarkdownContent('Error generating testing instructions: ' + (error.response?.data?.error || error.message));
    }
  };
  // useEffect(() => {
  //   // Update the previous results section
  //   const prevResElement = document.getElementById('prevRes');
  //   if (prevResElement) {
  //     prevResElement.innerHTML = previousMarks.map(markdown => `<div><ReactMarkdown>${markdown}</ReactMarkdown></div>`).join('');
  //   }
  // }, [previousMarks]);
  return (
    <div className="container">
      <div id="prevRes" style={{ textAlign: 'left' }}>{previousMarks.length > 0 && (
          <div>
            <h3>Previous Results:</h3>
            {previousMarks.map((markdown, index) => (markdown.length != 1 ?
              <div key={index} className="prevres" style={{marginBottom: '16px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#134D6F',}}>
                <div>{index+1}</div>
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </div> : <div></div>
            ))}
          </div>
        )}</div>
      <div id="results" className="text" style={{ textAlign: 'left' }}><ReactMarkdown>{markdownContent}</ReactMarkdown></div>
      <label htmlFor="context" style={styles.label}>Optional Context:</label>
      <textarea id="context" rows={5} style={styles.textarea} onChange={handleContextChange} />
      <label htmlFor="screenshots" style={styles.label}>Screenshots:</label>
      <input type="file" id="screenshots" multiple style={styles.input} onChange={handleScreenshotChange}/>
      <button
        style={styles.button}
        onMouseOver={e => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
        onMouseOut={e => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
        onClick={handleGenerateInstructions}
      >
        Describe Testing Instructions
      </button>
    </div>
  );
}

export default TestingTool;