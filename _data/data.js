var fetch = require('node-fetch');
var escapeHtml = require('escape-html');
var Text = require('slate').Text;
var gqlClient = require('graphql-request');
var gql = gqlClient.gql;
const { gqlEndPoint } = process.env;

const serialize = node => {
  if (Text.isText(node)) {
    let string = escapeHtml(node.text)
    if (node.bold) {
      string = `<strong>${string}</strong>`
    }
    if (node.italic) {
      string = `<em>${string}</em>`
    }
    if (node.underline) {
      string = `<u>${string}</u>`
    }
    if (node.strikethrough) {
      string = `<s>${string}</s>`
    }
    if (node.subscript) {
      string = `<sub>${string}</sub>`
    }
    if (node.superscript) {
      string = `<sup>${string}</sup>`
    }
    return string
  }

  const children = node.children.map(n => serialize(n)).join('')

  switch (node.type) {
    case 'heading':
      return `<h${node.level}>${children}</h${node.level}>`
    case 'blockquote':
      return `<blockquote>${children}</blockquote>`
    case 'paragraph':
      let htmlClass = '';
      if (node.textAlign == 'center') {
        htmlClass = 'text-center';
      } else if (node.textAlign == 'end') {
        htmlClass = 'text-right';
      } else {
        htmlClass = 'text-left';
      }
      return `<p class="${htmlClass}">${children}</p>`
    case 'unordered-list':
      return `<ul>${children}</ul>`
    case 'ordered-list':
      return `<ol>${children}</ol>`
    case 'list-item':
      return `<li>${children}</li>`
    case 'divider':
      return `<hr/>`
    case 'link':
      return `<a href="${escapeHtml(node.href)}" class="text-primary">${children}</a>`
    default:
      return children
  }
}

module.exports = async function () {
  const productQuery = gql`{
    products (where: { status: { equals: "PUBLISHED" } }) {
      id
      name
      slug
      status
      sku
      creationDate
      lastUpdatedDate
      saleCount
      description
      additionalInformation {
        document
      }
      categories {
        id
        name
        slug
      }
      tags {
        tag
      }
      options {
        optionName {
          optionName
        }
        optionValues {
          optionValue
        }
      }
      defaultVariant
      variants (where: { status: { equals: "PUBLISHED" } }) {
        id
        options {
          optionName {
            optionName
          }
          optionValue {
            optionValue
          }
        }
        title
        image {
          publicUrl
        }
        description
        regularPrice
        salePrice
        price
        salePercentage
        length
        width
        height
        weight
        sku {
          id
          sku
        }
      }
      accessories (where: { status: { equals: "PUBLISHED" } }) {
        id
        name
        status
        price
      }
    }
  }`;

  const salesQuery = gql`{
    sales(
      where: {
        startDate: { lt: "${new Date().toISOString()}" }
        endDate: { gt: "${new Date().toISOString()}" }
      }
    ) {
      saleCode
      startDate
      endDate
      productsIsIn {
        id
      }
      discountPercentage
    }
  }`;

  const offersQuery = gql`{
    offers(
      where: {
        startDate: { lt: "${new Date().toISOString()}" }
        endDate: { gt: "${new Date().toISOString()}" }
      }
    ) {
      couponCode
      startDate
      endDate
      minimumItemsPerOrder
      discountAmount
      freeShipping
      freebieProducts {
        id
      }
      offerText
      offerImage {
        image {
          publicUrl
        }
      }
    }
  }`;

  const categoriesQuery = gql`{
    categories {
      id
      name
      slug
      parentCategories {
        id
      }
      childCategories {
        id
      }
      featureInHomePage
      productsCount
      products (where: { status: { equals: "PUBLISHED" } }) {
        id
      }
    }
  }`;

  const tagsQuery = gql`{
    tags {
      id
      tag
      products {
        id
      }
    }
  }`;

  const shippingZonesQuery = gql`{
    shippingZones {
      id
      name
      country
      countryCode
      state
      stateCode
      methods {
        id
        name
        method
        baseCost
        charge
        perEachKg
        overKg
        expectedDeliveryText
      }
    }
  }`;

  let prdObject = {};

  let collections = {
    sortedLists: {
      onSale: [],
      bestSellers: [],
      priceLowToHigh: [],
      priceHighToLow: [],
      dateOldToNew: [],
      dateNewToOld: [],
      topOnSale: [],
      newArrivals: [],
      topBestSellers: []
    }
  };

  let metadata = {
    products: {},
    categories: {}
  }

  let categories = await gqlClient.request(gqlEndPoint, categoriesQuery)
    .then(res => res.categories);

  let sales = await gqlClient.request(gqlEndPoint, salesQuery)
    .then(res => res.sales);

  let offers = await gqlClient.request(gqlEndPoint, offersQuery)
    .then(res => res.offers);

  let products = await gqlClient.request(gqlEndPoint, productQuery)
    .then(res => res.products);

  let tags = await gqlClient.request(gqlEndPoint, tagsQuery)
    .then(res => res.tags);

  let shippingZones = await gqlClient.request(gqlEndPoint, shippingZonesQuery)
    .then(res => res.shippingZones);

  products.forEach(product => {
    prdObject[product.id] = product;

    if (product.additionalInformation && product.additionalInformation.document) {
      product.additionalInformation.document = serialize({
        children: product.additionalInformation.document
      });
    }

    product.variants.some((v, i) => {
      if (v.title == product.defaultVariant) {
        product.defaultVariantIndex = i;
        product.defaultVariantId = v.id;
        return true;
      }
      return false;
    });

    if (product.defaultVariantIndex == undefined) {
      product.defaultVariantIndex = 0;
      product.defaultVariantId = product.variants[0].id;
    }

    product.isOnSale = false;
    sales.forEach(s => {
      if (s.productsIsIn.map(v => v.id).includes(product.id)) {
        product.isOnSale = true;
        product.variants.forEach(v => {
          v.salePrice = Math.round(v.regularPrice - (v.regularPrice * s.discountPercentage / 100));
          v.salePercentage = s.discountPercentage;
          v.price = v.salePrice;
        });
      }
    });

    let defaultVariant = product.variants[product.defaultVariantIndex];

    metadata.products[product.id] = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: defaultVariant.image.publicUrl,
      defaultVariantId: product.defaultVariantId,
      regularPrice: defaultVariant.regularPrice,
      salePrice: defaultVariant.salePrice,
      price: defaultVariant.price,
      salePercentage: defaultVariant.salePercentage,
      saleCount: product.saleCount,
      creationDate: new Date(product.creationDate).getTime(),
      sku: defaultVariant.sku ? defaultVariant.sku.sku : null
    }

    collections.sortedLists.bestSellers.push(metadata.products[product.id]);
    collections.sortedLists.priceLowToHigh.push(metadata.products[product.id]);
    collections.sortedLists.priceHighToLow.push(metadata.products[product.id]);
    collections.sortedLists.dateOldToNew.push(metadata.products[product.id]);
    collections.sortedLists.dateNewToOld.push(metadata.products[product.id]);
  });

  sales.forEach(sale => {
    sale.productsIsIn.forEach(v => {
      if (!collections.sortedLists.onSale.includes(v.id)) {
        collections.sortedLists.onSale.push(v.id);
      }
    })
  });

  collections.sortedLists.onSale =
    collections.sortedLists.onSale
      .map(v => metadata.products[v])
      .sort((a, b) => { return b.saleCount - a.saleCount; });

  collections.sortedLists.bestSellers =
    collections.sortedLists.bestSellers.sort((a, b) => { return b.saleCount - a.saleCount; });
  collections.sortedLists.priceLowToHigh =
    collections.sortedLists.priceLowToHigh.sort((a, b) => { return a.price - b.price; });
  collections.sortedLists.priceHighToLow =
    collections.sortedLists.priceHighToLow.sort((a, b) => { return b.price - a.price; });
  collections.sortedLists.dateOldToNew =
    collections.sortedLists.dateOldToNew.sort((a, b) => { return a.creationDate - b.creationDate; });
  collections.sortedLists.dateNewToOld =
    collections.sortedLists.dateNewToOld.sort((a, b) => { return b.creationDate - a.creationDate; });

  collections.sortedLists.topOnSale = collections.sortedLists.onSale.slice(0, 8);
  collections.sortedLists.newArrivals = collections.sortedLists.dateNewToOld.slice(0, 8);
  collections.sortedLists.topBestSellers = collections.sortedLists.bestSellers.slice(0, 8);

  categories.forEach(category => {
    if (category.additionalInformation && category.additionalInformation.document) {
      category.additionalInformation.document = serialize({
        children: category.additionalInformation.document
      });
    }

    category.products = category.products.map(product => metadata.products[product.id]);

    metadata.categories[category.id] = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      products: category.products.map(product => ({ id: product.id })),
    }
  });

  function getChildCategories(parent) {
    let c = [];
    categories.filter(v => {
      return (!parent && (!v.parentCategories || (Array.isArray(v.parentCategories) && v.parentCategories.length == 0))) || (Array.isArray(v.parentCategories) && v.parentCategories.map(pc => pc.id).includes(parent));
    }).forEach(v => {
      c.push({
        id: v.id,
        name: v.name,
        slug: v.slug,
        categories: getChildCategories(v.id)
      });
    });
    return c;
  }

  let shopByCategory = getChildCategories();

  products.forEach(product => {
    product.relatedProducts = [];

    product.categories.forEach(c => {
      metadata.categories[c.id].products.forEach(p => {
        if (p.id != product.id) {
          product.relatedProducts.push(p.id);
        }
      });
    });

    product.relatedProducts.sort(function (a, b) {
      return metadata.products[b].saleCount - metadata.products[a].saleCount;
    });

    product.relatedProducts = product.relatedProducts.slice(0, 8);

    if (product.relatedProducts.length != 8) {
      collections.sortedLists.bestSellers.forEach(p => {
        if (product.relatedProducts.length <= 8 && !product.relatedProducts.includes(p.id) && p.id != product.id) {
          product.relatedProducts.push(p.id);
        }
      });
    }

    product.relatedProducts = product.relatedProducts.map(pid => metadata.products[pid]);
  });

  let zones = {};

  shippingZones.forEach(z => {
    if (!zones[z.countryCode]) {
      zones[z.countryCode] = {
        name: z.country,
        states: {}
      }
    }
    zones[z.countryCode].states[z.stateCode] = {
      name: z.state,
      methods: z.methods
    }
  });

  let announcements = [];
  announcements.push({
    message: 'Secure Online Payment'
  });
  announcements.push({
    message: 'No Cash on Delivery'
  });
  announcements.push({
    message: 'Save while shopping'
  });

  let reviews = [];
  reviews.push({
    name: 'Varsha B',
    message: 'A big thanks to Holi Colours Jewellery for bringing such unique designs along with super fast delivery',
    images: ['https://firebasestorage.googleapis.com/v0/b/holi-colours-jewellery.appspot.com/o/products%2F10%2Freviews%2F5946666c-1bfa-445f-a654-a91ec4e0d426?alt=media&token=eea67ad3-d6a0-459e-afd1-91f8a045afa9']
  });
  reviews.push({
    name: 'Vishnupriya',
    message: 'Amazing designs and at such reasonable prices. Loved the experience.',
    images: ['https://firebasestorage.googleapis.com/v0/b/holi-colours-jewellery.appspot.com/o/products%2F10%2Freviews%2F0c26e499-5242-4b5c-965e-04b08c968a74?alt=media&token=d70762d1-9b3d-4382-a5aa-2448e4295ea4']
  });
  reviews.push({
    name: 'Aditya',
    message: 'Got this as a gift for my Mom - she absolutely loved it! Thanks Holi Colours!',
    images: ['https://firebasestorage.googleapis.com/v0/b/holi-colours-jewellery.appspot.com/o/products%2F10%2Freviews%2Fd9d838b6-9dc1-4b06-bd14-0d6c663818ff?alt=media&token=bc1e9824-021d-42a6-83ea-ecde23410b69']
  });
  reviews.push({
    name: 'Sanu',
    message: `Best Silver Jewellery. Holi Colours's collection is a mix of Modern yet traditional, and affordable as well.`,
    images: ['https://firebasestorage.googleapis.com/v0/b/holi-colours-jewellery.appspot.com/o/products%2F10%2Freviews%2F5438c967-cec4-41f4-b542-9fd53c8c4156?alt=media&token=c4ecddd6-9240-429a-af13-0e973c371c00']
  });

  let faqs = [];
  faqs.push({
    question: `How many days does the product takes to arrive?`,
    answer: `It takes 7-10 working days to deliver our products across India (the product will be dispatched within 4 working days from your payment date. Saturday and Sunday are not accountable).`
  });
  faqs.push({
    question: `Is there an option to get your product before the defined delivery time?`,
    answer: `Yes, we do have two options on the site (Standard and Express Delivery). Please select the "Express Delivery" shipping method on the Checkout page.`
  });
  faqs.push({
    question: `Where can I get the product's real image?`,
    answer: `All the pictures on the website were taken by our in-house photographer without editing and filter in place.`
  });
  faqs.push({
    question: `Where and when can I get the tracking id?`,
    answer: `You'll get your tracking id via mail on the 4th working day from your payment date.`
  });
  faqs.push({
    question: `Will you ship overseas?`,
    answer: `Yes, we do. Please text us on WhatsApp (87788-76584) and our team will assist you.`
  });
  faqs.push({
    question: `What should I do if I haven't got the product within the defined time?`,
    answer: `Please send an email to holicolourscustomercare@gmail.com. Our team will assist you within 30 minutes`
  });
  faqs.push({
    question: `Will you take back your product in case of damage?`,
    answer: `Yes, we do. Please text us on WhatsApp (87788-76584) with the product unboxing video and our team will assist you.`
  });
  faqs.push({
    question: `Does Cash On Delivery/Installment options available for payment?`,
    answer: `No, as of now we are not offering both of these options. We will let you know if we enable these options in the future.`
  });
  faqs.push({
    question: `Do you have whatsapp broadcast group?`,
    answer: `Yes we do have, please do text us in whatsapp so that we'll add you to our regular update broadcast ( it is not a reseller group .. So please don't reach us for reselling )`
  });
  faqs.push({
    question: `What is the jewellery made of ?`,
    answer: `Each Jewellery is made up of " base metal " such as Copper, Brass, Zinc, and Bronze 
      Then coated with premium quality matte or antique polish`
  });
  faqs.push({
    question: `How to take care of jewellery?`,
    answer: `Please do visit jewellery care instruction page`
  });
  faqs.push({
    question: `Is their any guarantee or warranty for jewellery?`,
    answer: `No, but we'll serve you with premium quality products.`
  });
  faqs.push({
    question: `What if a product I want to buy is Sold Out?`,
    answer: `We do have subscribe button on the right side of particular jewellery please do subscribe it .. So that our team can work on restocking process in no time. As well you can pre book it via whatsapp 8778876584.`
  });
  faqs.push({
    question: `Will the products be checked for damage before dispatch?`,
    answer: `Yes, before packing your order had been undergone 3 step verification.`
  });
  faqs.push({
    question: `What will be the Size of the product?`,
    answer: `The approx. size in terms of dimensions and weight are mentioned in the description of the post.`
  });
  faqs.push({
    question: `Can I speak to someone about a problem on the website?`,
    answer: `We always welcome your valuable feedback and strive to offer you the joy of jewellery shopping with every visit. You can contact us by email holicolourscustomercare@gmail.com or via whatsapp 8778876584.`
  });
  faqs.push({
    question: `Do you have a physical outlet?`,
    answer: `No, we don't have any physical outlet.`
  });
  faqs.push({
    question: `How do I know if my order has been confirmed?`,
    answer: `You'll get notified right from ordering to delivery via registered mail.`
  });
  faqs.push({
    question: `Do I need to create an account to buy products?`,
    answer: `It is optional but our expert team suggest you to create account so that it'll help you manage address, card details securely, your order history, etc.,`
  });
  faqs.push({
    question: `How do I track my order?`,
    answer: `Once your order is dispatched you'll get tracking id via mail as well how to track procedure too..that will help you locate your parcel.`
  });
  faqs.push({
    question: `Do you undertake bulk orders?`,
    answer: `Yes please text us 8778876584.`
  });
  faqs.push({
    question: `Can I transfer funds through NEFT/IMPS and will you undertake such orders through WhatsApp?`,
    answer: `Yes, if you are a person who is unaware of Net banking, Card based payments, Google Pay, we can definitely undertake such orders over what’s app and help you with NEFT/IMPS details.`
  });

  let banner = { message: '' };

  return {
    products: products,
    categories: categories,
    shopByCategory: shopByCategory,
    collections: collections,
    tags: tags,
    offers: offers,
    metadata: metadata,
    shippingZones: zones,
    announcements: announcements,
    reviews: reviews,
    faqs: faqs,
    banner: banner,
    currentYear: new Date().getFullYear()
  };
};