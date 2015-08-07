var fs=require('fs');
var path=require('path');
var handlebars = require('handlebars');
var commonmark = require('commonmark');
var browserSync = require('browser-sync').create();

function setCurrentNavpage(sitemap, page_name){
  sitemap['pages'].forEach(function(page){
    page.isCurrent = page.name == page_name;
  });
}

function getCertificates(){
  var certificates = [];
  var products = ["丙酮","乙二醇","二甘醇","二甲苯","甲苯","甲醇"];
  var images = fs.readdirSync('public/certificate');
  for(var product of products){
    certificate_images = [];
    for(var imagename of images){
      if(imagename.indexOf(product) >= 0){
        certificate_images.push({name: path.basename(imagename, path.extname(imagename)), url: encodeURI(imagename)});
      }
    }
    certificates.push({product: product, images: certificate_images})
  }
  return certificates;
}

desc('Generate html files into public folder.')
task('html', function(){
  console.log('Generating html files...');
  var layout = fs.readFileSync('src/layout.hbs', 'utf8');
  var template = handlebars.compile(layout);
  var sitemap = JSON.parse(fs.readFileSync('src/sitemap.json', 'utf8'));

  var snippets = fs.readdirSync('src/snippet');
  snippets.forEach(function(filename) {
    var snippet = fs.readFileSync('src/snippet/' + filename, 'utf8');
    handlebars.registerPartial('snippet/' + path.basename(filename, '.hbs'), snippet);
  });

  sitemap['pages'].forEach(function(page){
    var content = fs.readFileSync('src/pages/'+page['name']+'.hbs', 'utf8');
    handlebars.registerPartial('content', content);
    setCurrentNavpage(sitemap, page.name);
    if(page.name == "certificate"){
      page.certificates = getCertificates();
    }
    var context = {};
    context['site'] = sitemap;
    context['page'] = page;
    var html = template(context);
    fs.writeFileSync('public/'+page['name']+'.html', html);
  });
  
  var articles = fs.readdirSync('src/article');
  if(articles.length > 0){
    jake.mkdirP('public/article');
    var reader = new commonmark.Parser();
    var writer = new commonmark.HtmlRenderer();
    articles.forEach(function(filename) {
      var article = fs.readFileSync('src/article/' + filename, 'utf8');
      var parsed = reader.parse(article);
      var result = writer.render(parsed);
      handlebars.registerPartial('snippet/news', result);
      var content = fs.readFileSync('src/pages/news.hbs', 'utf8');
      handlebars.registerPartial('content', content);
      setCurrentNavpage(sitemap, 'news');
      var context = {};
      context['site'] = sitemap;
      context['page'] = {
        "name": "news",
        "cn_text": "最新动态",
        "en_text": "Latest News",
      };
      var html = template(context);
      fs.writeFileSync('public/article/'+path.basename(filename, '.md')+'.html', html);
    });
  }
});

// Watch files for changes, process and reload files automatically
desc('Start http server with BrowserSync.')
task('serve', ['html'], function () {
  browserSync.watch([
      'src/layout.hbs',
      'src/sitemap.json',
      'src/pages/*.hbs',
      'src/snippet/*.hbs',
      'src/article/*.md'
    ]).on('change', function(){
      jake.Task['html'].execute();
    });
  browserSync.watch([
      'public/*.html',
      'public/*/*.css'
    ]).on('change', browserSync.reload);

  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: 'public',
      index: 'home.html',
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });
});

task('default', ['html']);