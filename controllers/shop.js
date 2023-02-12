const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path =require('stripe')//Stripe key, not working changes in the API;

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.getCheckout = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user => {
    const products = user.cart.items;
    let total =0;
    products.forEach(p=>{
      total += p.quantity*p.productId.price;
    });
    res.render('shop/checkout', {
      path: '/checkout',
      pageTitle: 'checkout',
      products: products,
      totalSum:total
    });
  })
  .catch(err => console.log(err));

  // let products;
  // let total = 0;
  // req.user
  // .populate('cart.items.productId')
  // //.execPopulate()
  // .then(user => {
  //   products = user.cart.items;
  //     total = 0;
  //     products.forEach(p => {
  //       total += p.quantity * p.productId.price;
  //     });
  //     return stripe.checkout.sessions.create({
  //       payment_method_types: ['card'],
  //       line_items: products.map(p => {
  //         return {
  //           name: p.productId.title,
  //           description: p.productId.description,
  //           amount: p.productId.price * 100,
  //           currency: 'usd',
  //           quantity: p.quantity
  //         };
  //       }),
  //       success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
  //       cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
  //     });
  //   })
  //   .then(session => {
  //     res.render('shop/checkout', {
  //       path: '/checkout',
  //       pageTitle: 'Checkout',
  //       products: products,
  //       totalSum: total,
  //       sessionId: session.id
  //     });
  //   })
  //   // .catch(err => {
  //   //   const error = new Error(err);
  //   //   error.httpStatusCode = 500;
  //   //   return next(error);
  //   // });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    // .catch(err => {
    //   const error = new Error(err);
    //   error.httpStatusCode = 500;
    //   return next(error);});
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};
