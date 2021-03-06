const express        = require('express');
const router         = express.Router();
const ensureLogin    = require("connect-ensure-login");
const STATES         = require("../models/states");
const multer         = require('multer');
const HOUSING        = require('../models/housing');
const uploadCloud    = require('../config/cloudinary');
const User           = require('../models/User');

router.get("/addHousing",ensureLogin.ensureLoggedIn(), (req,res,next) => {
  
  STATES.find().sort({name:1}).then(states => {
    if (!states) {
      return res.status(404).render('not-found');
    }
    res.render("houses/addHouse", {states, user: req.user});
  });
});

router.post("/addHousing", uploadCloud.single('photo'), (req, res, next) => {

   const { title, price, motive, state, pets, laundry, available, description } = req.body;

   if (req.file) {
      const imagePath = req.file.url;
      const imageName = req.file.originalname;

      const ownerOfPost = req.user._id;
      const newHouse = new HOUSING({title, price, motive, state, ownerOfPost, pets, laundry, available, description, imagePath, imageName });
      
      req.user.classifieds.push(newHouse);
      const classifieds = req.user.classifieds;

      newHouse.save((err) => {
        if (err) 
          {
          res.render("houses/addHouse", { message: "Something went wrong" });
          } 
        else 
          {
            User.update({_id: ownerOfPost}, { $set: { classifieds }},{new: true})
            .then((e) => {
                res.redirect('/');
            })
            .catch((error) => {
              console.log(error);
            });
          }
      });
  }
    else {
            const ownerOfPost = req.user._id;
            const newHouse = new HOUSING({title, price, motive, state, ownerOfPost, pets, laundry, available, description});
            
            req.user.classifieds.push(newHouse);
            const classifieds = req.user.classifieds;

          newHouse.save((err) => {
              if (err) {
                res.render("houses/addHouse", { message: "Something went wrong" });
              } 
              else {
                  User.update({_id: ownerOfPost}, { $set: { classifieds }},{new: true})
                  .then((e) => {
                      res.redirect('/');
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              }
       });
    }
 });

  router.get('/:id/Yours', ensureLogin.ensureLoggedIn(), (req, res, next) => {
  let userId = req.params.id;
  User.findById(userId).populate('classifieds')
   .then(populated => {
      if (!populated) {
        return res.status(404).render('not-found');
    }
    
  res.render("users/YourClass", {populated, user: req.user});
})
.catch((error) => {
console.log(error);
});
});

 router.get('/:id/edit', ensureLogin.ensureLoggedIn(), (req, res, next) => {
  const houseId = req.params.id;
  
  HOUSING.findById(houseId)
   .then(house => {
      if (!house) {
        return res.status(404).render('not-found');
    }

    STATES.find().sort({name:1}).then(states => {
      if (!states) {
        return res.status(404).render('not-found');
      }
      res.render("houses/editHouse", {states, id: houseId, title: house.title, price: house.price, motive: house.motive, available: house.available, pets: house.pets, laundry: house.laundry, description: house.description, user: req.user});
    });
})
.catch((error) => {
console.log(error);
});
});

//POST ROUTE FOR HOUSE PROFILE EDITING
router.post('/:id/edit', uploadCloud.single('photo'), (req, res, next) => {

  let houseId = req.params.id;

  let { title, price, motive, state, pets, laundry, available, description } = req.body;

      console.log(pets,available,laundry);
      if (pets === undefined) {pets = "No";}
      if (laundry === undefined) {laundry = "No";}
      if (available === undefined) {available = "No";}
      if (req.file) {
      const imagePath = req.file.url;
      const imageName = req.file.originalname;

      HOUSING.update({_id: houseId}, { $set: {title, price, motive, state, description, pets, laundry, available, imagePath, imageName }},{new: true})
      .then((e) => {
           res.redirect('/');
      })
       .catch((error) => {
         console.log(error);
       });
           }
           else {
            
            HOUSING.update({_id: houseId}, { $set: { title, price, motive, state, pets, laundry, available, description }},{new: true})
      .then((e) => {
           res.redirect('/');
      })
       .catch((error) => {
         console.log(error);
       });

           }
                
});

//DELETING HOUSE ROUTE
router.post('/:id/delete', ensureLogin.ensureLoggedIn(), (req, res, next) => {

const houseId = req.params.id;
HOUSING.findByIdAndRemove(houseId)
.then(house => {
  if (!house) {
    return res.status(404).render('not-found');
}
      const ownerOfPost = req.user._id;
      const destroyingTheHouse = req.user.classifieds.indexOf(houseId);

      req.user.classifieds.splice(destroyingTheHouse,1);

      const classifieds = req.user.classifieds;

      User.update({_id: ownerOfPost}, { $set: { classifieds }},{new: true})
      .then((e) => {
          console.log('Deleting succes!!');
          res.redirect('/');
      })
      .catch((error) => {
        console.log(error);
      });
})
.catch(next);
});

module.exports = router;