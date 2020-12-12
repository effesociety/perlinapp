import Logo from './images/logo.png';
import Grid from "@material-ui/core/Grid";

const Header = () =>  {
    return (
        <header className="header">
            <Grid container direction="row" justify="center" alignItems="center" m={4}>
                <Grid item>
                    <img draggable="false" src={Logo} className="logo"/>
                </Grid>
            </Grid>
      </header>
    );
  }
  
  export default Header;