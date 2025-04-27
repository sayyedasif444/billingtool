'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from './data/blogData';

interface BlogPostContentProps {
  post: BlogPost;
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <div className="bg-gradient-to-b from-black via-black/95 to-dark/95 min-h-screen">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-[30rem] h-[30rem] bg-primary/3 rounded-full blur-[8rem] opacity-70" />
        <div className="absolute bottom-10 right-10 w-[25rem] h-[25rem] bg-blue-500/3 rounded-full blur-[6rem] opacity-60" />
        <div className="absolute top-1/3 right-1/4 w-[20rem] h-[20rem] bg-blue-500/3 rounded-full blur-[5rem] opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5 shadow-xl overflow-hidden"
        >
          {/* Header Image */}
          <div className="relative w-full h-72 md:h-96">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/90"></div>
            
            {/* Category badge */}
            <div className="absolute top-6 left-6">
              <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary/40 rounded-full text-white">
                {post.category}
              </span>
            </div>
            
            {/* Back button */}
            <Link
              href="/blog"
              className="absolute top-6 right-6 flex items-center px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm hover:bg-black/60 transition-colors"
            >
              <svg 
                className="w-4 h-4 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to blog
            </Link>
          </div>
          
          <div className="px-6 py-8 md:p-10">
            {/* Publication date */}
            <div className="text-sm text-gray-400 mb-3">{post.publishedAt}</div>
            
            {/* Post title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">{post.title}</h1>
            
            {/* Author info */}
            <div className="flex items-center mb-8 pb-8 border-b border-white/10">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary/20">
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="ml-4">
                <p className="font-medium text-white">{post.author.name}</p>
              </div>
            </div>
            
            {/* Post content */}
            <div className="prose prose-invert prose-lg max-w-none">
              {/* Display the excerpt if content is not available */}
              <p className="text-lg text-gray-300 mb-6">{post.excerpt}</p>
              
              {/* If there's actual content, render it, otherwise show a placeholder */}
              <div className="space-y-6 text-gray-300">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce varius faucibus massa sollicitudin amet augue. Nibh metus a semper purus mauris duis. Lorem eu neque, tristique quis duis. Nibh scelerisque ac adipiscing velit non nulla in amet pellentesque.
                </p>
                <p>
                  Sit turpis pretium eget maecenas. Vestibulum dolor mattis consectetur eget commodo vitae. Amet pellentesque sit pulvinar lorem mi a, euismod risus rhoncus. Elementum ullamcorper nec, habitasse vulputate. Eget dictum quis est sed egestas tellus, a lectus. Quam ullamcorper in fringilla arcu aliquet fames arcu.
                </p>
                
                <blockquote className="border-l-4 border-primary/70 pl-4 py-3 my-8 italic">
                  "Technology is best when it brings people together."
                  <footer className="mt-2 text-sm">- Matt Mullenweg</footer>
                </blockquote>
                
                <p>
                  Diam nunc lacus lacus aliquam turpis enim. Eget hac velit est euismod lacus, amet semper semper ultrices amet. Ut viverra at ultricies lactam diam. Volutpat est eget egestas ultrices nunc, sagittis. Semper amet aenean amet placerat facilisi.
                </p>
              </div>
            </div>
            
            {/* Tags */}
            <div className="mt-10 pt-8 border-t border-white/10">
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-sm text-white font-medium">Tags:</span>
                {['React', 'Next.js', 'Web Development'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-md text-white/80 hover:text-white transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Share buttons */}
              <div className="flex items-center mt-8">
                <span className="text-sm text-white font-medium mr-4">Share:</span>
                <div className="flex space-x-3">
                  {[
                    { name: 'Twitter', icon: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z' },
                    { name: 'Facebook', icon: 'M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z' },
                    { name: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667h-3.554v-11.452h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zm-15.11-13.019c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019h-3.564v-11.452h3.564v11.452zm15.106-20.452h-20.454c-.979 0-1.771.774-1.771 1.729v20.542c0 .956.792 1.729 1.771 1.729h20.454c.978 0 1.778-.773 1.778-1.729v-20.542c0-.955-.8-1.729-1.778-1.729z' }
                  ].map((social) => (
                    <button
                      key={social.name}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary/20 text-white/80 hover:text-white transition-colors"
                      aria-label={`Share on ${social.name}`}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d={social.icon} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 