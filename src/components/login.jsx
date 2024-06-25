import Typography from '@mui/material/Typography';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Login() {
  const navigate = useNavigate();

  const [Reg, setReg] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [Records, setRecords] = useState([]);

  const [inlog, setInlog] = useState({
    email: '',
    password: '',
  });

  const takeinput = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    setReg((Reg) => {
      return { ...Reg, [name]: value };
    });
  };

  const handlesubmit = (e) => {
    e.preventDefault();

    const newrec = { ...Reg, id: new Date().getTime().toString() };

    console.log(Records);

    setRecords((Records) => {
      return { ...Records, newrec };
    });

    setReg((Reg) => {
      return {
        username: '',
        email: '',
        password: '',
      };
    });
  };

  const loginput = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    setInlog((inlog) => {
      return { ...inlog, [name]: value };
    });
  };

  const handleinlog = (e) => {
    e.preventDefault();

    const login = { ...inlog, id: new Date().getTime().toString() };

    console.log(inlog.name);
    setInlog((inlog) => {
      return {
        email: '',
        password: '',
      };
    });
  };

  // const navigateTo = () => {
  //   navigate("/");
  // };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (Reg.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inlog),
      });
      const data = await response.json();
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (Reg.username.length < 3 || Reg.username.length > 10) {
      toast.error('Username must be between 3 and 10 characters');
      return;
    }
    if (Reg.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Reg),
      });
      const data = await response.json();
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  const handleChange = (e, type) => {
    const { name, value } = e.target;
    if (type === 'login') {
      setInlog((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    } else {
      setReg((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  return (
    <>
      <ToastContainer />
      <style>
        {`
        #body {
            background-size: cover;
            height: 100%;
            overflow: hidden;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 90vh;
            font-family: 'Jost', sans-serif;
        }

        .main {
            width: 500px;
            height: 495px;
            overflow: hidden;
            backdrop-filter: blur(0px) saturate(134%);
            -webkit-backdrop-filter: blur(0px) saturate(134%);
            background-color: rgb(19 34 71);
            border-radius: 20px;
            box-shadow: 5px 20px 50px #000;
        }

        #chk {
            display: none;
        }

        .login {
            position: relative;
            width:100%;
            height: 100%;
        }

        .span {
            cursor: pointer;
            color: #fff;
            font-size: 2.3em;
            justify-content: center;
            display: flex;
            margin: 50px;
            font-weight: bold;
            cursor: pointer;
        }

        .input {
            width: 60%;
            height: 20px;
            justify-content: center;
            display: flex;
            margin: 20px auto;
            padding: 13px;
            border: none;
            outline: none;
            border-radius: 20px;
        }

        .button {
            width: 60%;
            height: 40px;
            margin: 10px auto;
            justify-content: center;
            display: block;
            color: #fff;
            background-color: #cf2e2e;
            font-size: 1.2em;
            font-weight: bold;
            margin-top: 20px;
            outline: none;
            border: none;
            border-radius: 10px;
            padding: 2%;
            transition: .2s ease-in;
            cursor: pointer;
            text-shadow: 0.5px 0.5px 2px #fff;
        }

        .signup {
            height: 460px;
            background-image: linear-gradient(to bottom, rgb(255, 255, 255), rgb(200, 220, 255));
            border-radius: 60% / 10%;
            transform: translateY(-180px);
            transition: .8s ease-in-out;
        }

        .signup .span {
            cursor: pointer;
            color: #243b55;
            transform: scale(.6);
        }

        #chk:checked ~ .signup {
            transform: translateY(-500px);
        }

        #chk:checked ~ .signup .label {
            transform: scale(1); 
        }

        #chk:checked ~ .login .label {
            transform: scale(.6);
        }

        #login:hover {
            background-image: linear-gradient(to right bottom, #334151, #324355, #324459, #31465e, #304762);
            transform: scale(1.05,1.05);
            box-shadow: 1.5px 1.5px 5px rgb(250, 255, 255);
            color: #fff;
        }

        #signup:hover {
            background-image: linear-gradient(to right bottom, #eff5ff, #d2efff, #aaebff, #7de7f5);
            transform: scale(1.05,1.05);
            box-shadow: 3px 4px 5px rgb(41, 50, 51);
            color: #fff;
            cursor: pointer;
        }
      `}
      </style>

      <div className="header">
        <div className="logo">
          <img
            src="https://futuresfirst.com/wp-content/uploads/2019/12/ff.png"
            alt="Futures First"
          />
        </div>
        <div className="title-name">
          <Typography variant="h1" color="primary">
            Welcome to My Themed App
          </Typography>
        </div>

        <div className="user-options">
          <Link to="/login">LOGIN</Link>
          <Link to="/">LOGOUT</Link>
        </div>
      </div>

      <div id="body">
        <div class="main">
          <input class="input" type="checkbox" id="chk" aria-hidden="true" />
          <div class="login">
            <form action="" onSubmit={handleLogin}>
              <span class="span">
                <label for="chk" aria-hidden="true">
                  Log In
                </label>
              </span>
              <input
                class="input"
                type="email"
                value={Reg.email}
                onChange={takeinput}
                autoComplete="off"
                name="email"
                placeholder="Email"
                required=""
              />
              <input
                class="input"
                type="password"
                value={Reg.password}
                onChange={takeinput}
                autoComplete="off"
                name="password"
                placeholder="Password"
                required=""
              />
              <button
                class="button"
                type="submit"
                // onClick={navigateTo}
                id="login"
              >
                Log In
              </button>
            </form>
          </div>

          <div class="signup">
            <form action="" onSubmit={handleSignup}>
              <span class="span">
                <label class="lable" for="chk" aria-hidden="true">
                  Sign Up
                </label>
              </span>
              <input
                class="input"
                type="text"
                value={Reg.username}
                onChange={takeinput}
                autoComplete="off"
                name="username"
                placeholder="User Name"
                required=""
              />
              <input
                class="input"
                type="email"
                value={inlog.email}
                onChange={loginput}
                autoComplete="off"
                name="email"
                placeholder="Email"
                required=""
              />
              <input
                class="input"
                type="password"
                defaultValue=""
                value={inlog.password}
                onChange={loginput}
                autoComplete="off"
                name="password"
                placeholder="Password"
                required=""
              />
              <button
                class="button"
                // onClick={navigateTo}
                type="submit"
                id="signup"
              >
                Sign Up
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
