var fs=require('fs');
var handlebars = require('handlebars');
var browserSync = require('browser-sync').create();

desc('Generate html files into public folder.')
task('html', function(){
  console.log('Generating html files...');
  var layout = fs.readFileSync('src/layout.hbs', 'utf8');
  var template = handlebars.compile(layout);
  var sitemap = JSON.parse(fs.readFileSync('src/sitemap.json', 'utf8'));

  sitemap['pages'].forEach(function(page){
    var content = fs.readFileSync('src/pages/'+page['name']+'.hbs', 'utf8');
    var context = {};
    sitemap['pages'].forEach(function(page2){
      page2.isCurrent = page2.name == page.name;
    });
    context['site'] = sitemap;
    context['page'] = page;
    handlebars.registerPartial('content', content);
    var html = template(context);
    fs.writeFileSync('public/'+page['name']+'.html', html);
  });
});

// Watch files for changes, process and reload files automatically
desc('Start http server with BrowserSync.')
task('serve', ['html'], function () {
  browserSync.watch([
      'src/layout.hbs',
      'src/sitemap.json',
      'src/pages/*.hbs'
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