import Logo from './images/logo.png';
import Grid from "@material-ui/core/Grid";
import 'animate.css/animate.css'

const Header = () =>  {
    return (
        <header className="header animate__animated animate__slideInUp">
            <Grid container direction="row" justify="center" alignItems="center" m={4}>
                <Grid item>
                    <img draggable="false" src={Logo} className="logo"/>
                </Grid>
            </Grid>
      </header>
    );
  }
  
  export default Header;