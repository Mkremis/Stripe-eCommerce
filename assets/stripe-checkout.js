const $form = document.getElementById("keys");
$form.addEventListener("submit", (e) => {
  e.preventDefault();

  checkout(new FormData($form));
});
function checkout(STRIPE_KEYS) {
  const $tacos = document.getElementById("tacos"),
    $template = document.getElementById("taco-template").content,
    $fragment = document.createDocumentFragment(),
    fetchOptions = {
      headers: { Authorization: `Bearer ${STRIPE_KEYS.secret}` },
    },
    moneyFormat = (num) => `$${num.slice(0, -2)},${num.slice(-2)}`,
    $loader = document.createElement("img");
  $loader.src = "./assets/loader.svg";
  $loader.classList.add("loader");
  document.querySelector("main").appendChild($loader);

  let products, prices;

  Promise.all([
    fetch("https://api.stripe.com/v1/products", fetchOptions),
    fetch("https://api.stripe.com/v1/prices", fetchOptions),
  ])
    .then((responses) => Promise.all(responses.map((res) => res.json())))
    .then((json) => {
      products = json[0].data;
      prices = json[1].data;
      console.log(products, prices);
      prices.forEach((price) => {
        let price_id = price.id,
          price_amount = moneyFormat(price.unit_amount_decimal),
          currency = price.currency.toUpperCase(),
          product_id = price.product,
          productData = products.filter((product) => product_id === product.id),
          productImg = productData[0].images[0],
          productName = productData[0].name,
          $figure = $template.querySelector(".taco"),
          $img = $template.querySelector(".taco img");
        $figure.setAttribute("data-price", price_id);
        $img.src = productImg;
        $img.id = product_id;
        $img.alt = productName;
        $template.querySelector(
          ".taco figcaption"
        ).innerHTML = `${productName} <br> ${currency} ${price_amount}`;
        let $clone = document.importNode($template, true);
        $fragment.appendChild($clone);
      });
      $tacos.appendChild($fragment);
      $loader.style.display = "none";
    })
    .catch((err) => {
      console.log(err);
      let message =
        err.statusText || "Ocurrió un error al conectarse con la API de Stripe";
      $tacos.innerHTML = `<p>Error ${err.status} : ${message}</p>`;
    });

  document.addEventListener("click", (e) => {
    if (e.target.matches(".taco *")) {
      let price_id = e.target.parentElement.getAttribute("data-price");
      Stripe(STRIPE_KEYS.public)
        .redirectToCheckout({
          lineItems: [{ price: price_id, quantity: 1 }],
          mode: "payment",
          successUrl: "http://127.0.0.1:5500/assets/stripe-success.html",
          cancelUrl: "http://127.0.0.1:5500/assets/stripe-cancel.html",
        })
        .then((res) => {
          if (res.error) {
            console.log("respuesta", res);
            $tacos.insertAdjacentElement("afterend", res.error.message);
          }
        });
    }
  });
}
