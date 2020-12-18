import React from 'react';
import { Box, Link, Typography } from '@material-ui/core';
import {Favorite, GitHub} from '@material-ui/icons';
  
class Footer extends React.Component{
    constructor(){
        super();
        this.state = {
          opacity: "0.5"
        }
        this.toggleGithub = this.toggleGithub.bind(this);
      }

      toggleGithub(){
        let opacity = this.state.opacity === "0.5" ? "1" : "0.5";
        this.setState({
          opacity: opacity
        })
      }
    
    render(){
        return(
            <footer className="footer">
                <Box align="center" marginBottom="10px">
                    <Link href="http://github.com/the-licato/perlinapp/" color="inherit">
                    <GitHub onMouseEnter={this.toggleGithub} onMouseLeave={this.toggleGithub} style={{opacity: this.state.opacity, fontSize:"50px",transition: "all 0.15s linear 0s"}}/>
                    </Link>
                </Box>
            </footer>
        )
    }
}
export default Footer;