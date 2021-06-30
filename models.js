const mongoose = require ('mongoose');
var Schema = mongoose.Schema;

const UserSchema = new Schema({
	email: {
	  type: String,
	  required: true,
	  unique: true
	},
	password: {
	  type: String,
	  required: true
	},
	fullname:String,
	birthday:String,
	favorites:Array
  });
  
var movieSchema = {
	id: Number,
	description: String,
	genre:{category: String},
	director:
		{id:Number,
		name:String,
		bio:String,
		birthYear:Number,
		deathYear:Number,
		imageURL:String}
};
module.exports = mongoose.model("movies", movieSchema);
module.exports = mongoose.model("users", UserSchema);