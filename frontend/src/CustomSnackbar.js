import {useState, useEffect} from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(2),
    },
  },
}));

export default function CustomSnackbar(props) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const {msg, severity} = props;

  useEffect(() => {
    setOpen(props.open);
  }, [props])


  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    props.closeSnackbar();
  };

  return (
    <div className={classes.root}>
      <Snackbar open={open} autoHideDuration={2000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity}>
          {msg}
        </Alert>
      </Snackbar>
    </div>
  );
}