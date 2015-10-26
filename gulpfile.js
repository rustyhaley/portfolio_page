"use strict";

// modules
var gulp = require('gulp'),
	del = require('del'),
	exec = require('child_process').exec,
	browserSync = require('browser-sync').create(),
	watch = require('gulp-watch'),
	autoprefixer = require('gulp-autoprefixer'),
	sass = require('gulp-ruby-sass'),
	sourcemaps = require('gulp-sourcemaps'),
	csso = require('gulp-csso'),
	csscomb = require('gulp-csscomb'),
	imagemin = require('gulp-imagemin'),
	runSequence = require('run-sequence'),
	gutil = require('gulp-util'),
	ftp = require('vinyl-ftp'),
	gulpif = require('gulp-if'),
	args = require('yargs').argv,
	fs = require('fs'),
	isDev = args.env === 'development';


// configuration
var config = {
	sourcefiles: "./source",
	compiled: "./public",
	files: {
		main: './source/**/*.html',
		styles: {
			sass: './source/sass/style.scss',
			dist: './public/css/',
			css: './public/css/style.css'
		},
		images: {
			src: './source/images/**/*',
			dist: './public/images/'
		}
	}
};


// server for compiled P.L. in "public" directory
gulp.task('clean', function(cb) {
	//del([config.compiled], cb);

	del('./public/sass', cb);
});


// compile sass (using Sass Ruby gem)
// includes autoprefix for better browser support
gulp.task('styles:sass', function() {
    return sass(config.files.styles.sass, {
    		sourcemap: (isDev) ? true : false,
	        lineNumber: (isDev) ? true : false
    	})
    	.on('error', function (err) {
      		console.error('Error!', err.message);
   		})
   		.pipe(autoprefixer({
            browsers: ['last 3 versions'],
            cascade: false
        }))
   		.pipe(gulpif(isDev, sourcemaps.write('maps', {
	        includeContent: false,
	        sourceRoot: '.'
	    })))
   		.pipe(gulpif(!isDev, csso()))
   		.pipe(gulpif(!isDev, csscomb()))
    	.pipe(gulp.dest(config.files.styles.dist))
    	.pipe(gulpif(isDev, browserSync.stream()));
});



// grouping of all style task
gulp.task('styles', ['styles:sass'], function() {
	var tasks = [
		'clean'
	];

	// run all tasks related to styling (CSS/Sass/etc)
	runSequence(tasks);
});



// html
gulp.task('html', function () {
	return gulp.src(config.files.main)
		.pipe(gulp.dest('./public/'));
});


// images
gulp.task('images', function () {
	return gulp.src(config.files.images.src)
		.pipe(gulpif(!isDev, imagemin()))
		.pipe(gulp.dest('./public/images/'));
});


// ftp deploy to server
gulp.task('deploy', function () {
    var conn = ftp.create( {
        host:     'ftp.website.com',
        user:     'username',
        password: 'password',
        port:     21,
        parallel: 10,
        log:      gutil.log
    } );

    var globs = [
        './public/**'
    ];

    return gulp.src(globs, {base: './public', buffer: false})
        .pipe(conn.newer('./public'))
        .pipe(conn.dest('/style-guide'));
});


// run tasks when files are updated
gulp.task('watch', function() {
	gulp.task('styles:watch', ['styles']);
	gulp.watch('./source/sass/**/*.scss', ['styles:watch']);
	gulp.watch('./core/styleguide/css/styleguide.scss', ['styles:watch']);

	gulp.task('images:watch', ['images']);
	gulp.watch('./source/images/**/*', ['images:watch']);

	gulp.task('html:watch', ['html']);
	gulp.watch(['./source/**/*.html'], ['html:watch']);
});


// server for compiled P.L. in "public" directory
gulp.task('serve', function() {
	browserSync.init({
		server: {
			baseDir: config.compiled
		}
	});
});


// default build
gulp.task('default', ['clean'], function() {
	// define build tasks
	var tasks = [
		'html',
		'images',
		'styles'
	];

	// add tasks if development
	if (isDev) {
		tasks.push('watch');
	}

	// run build and tasks
	runSequence(tasks, function() {
		// start watcher if "development"
		if (isDev) {
			gulp.start('serve');
		}
	});
});
