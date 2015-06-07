require 'sinatra'
require 'json'

set :public_folder, File.dirname(__FILE__) + '/public'

get "/" do
  redirect 'home.html'
end

get '/info' do
  [
    `cat /etc/redhat-release`,
    `uname -r`,
    `date`,
    File.absolute_path(__FILE__)
  ].join('<br>')
end

get '/update' do
  `jake html` +
  'updateed'
end

get '/restart' do
  `git pull` +
  `touch tmp/restart.txt` +
  'restarted'
end

get %r{/file/(.*)} do |path|
  expires 0, :no_cache, :must_revalidate
  path = '.' if path.empty?
  if Dir.exist? path
    @dirs = []
    @files = []
    Dir.entries(path).sort.each do |entry|
      file = File.join(path, entry)
      if File.directory? file
        @dirs << [file, entry]
      else
        @files << [file, entry]
      end
    end
    @title = 'File List'
    render :filelist
  elsif File.exist? path
    content_type "text/plain; charset=utf-8"
    send_file path
  else
    path + " not found"
  end
end