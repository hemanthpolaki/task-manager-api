const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'hemanthpolaki3@gmail.com',
        subject: 'Welcome to Task-Manager API service',
        html: `Hello ${name}, <br><br>

        I hope you will find our service is <b>useful</b> and <b>reliable</b>. <br>
        <img height=50% width=100% src="https://hp7-weather-app.herokuapp.com/img/me.jpg"><br><br><br><b>
        
        
        Thank You :)</b>`
    }).then((res) => {
    }).catch((err) => {
    })
}

const sendCanellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'hemanthpolaki3@gmail.com',
        subject: 'Cancellation of Task-Manager API service',
        html: `Hello ${name}, <br><br>

        This is to inform you that we have removed you from our service as per your request.<br>
        <b>Sorry</b> for any service that we're able to provide you. We'll come back <b>stronger</b> to meet your requirements again.<br>
        <img height=50% width=100% src="https://hp7-weather-app.herokuapp.com/img/me.jpg"><br><br><br><b>
        
        
        Thank You :)</b>`
    }).then((res) => {
    }).catch((err) => {
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCanellationEmail
}