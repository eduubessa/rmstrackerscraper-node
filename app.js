'use strict';

const fs = require('fs');
const Axios = require('axios');
const jsdom = require('jsdom');
const request = require("request");
const {JSDOM} = require("jsdom");
const {Mail} = require('./helper');

let requestOptions = {
    baseURL: "https://evoportaluk.tracker-rms.com",
    path: "/Opportunity/Lite/?db=SingularityDigitalEnterprise",
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
    }
};

this.Axios = Axios.create({
    baseURL: requestOptions.baseURL,
    headers: requestOptions.headers
});

this.JOBS = [];
this.ERRORS = [];
this.FILE = {
    PATH: './data/jobs.json'
}

this.Axios.get(requestOptions.path, {headers: requestOptions.headers})
    .then(async (response, request) => {
        if (response && response.status === 200) {
            const dom = new JSDOM(response.data);
            let posts = dom.window.document.querySelectorAll('div.fj_post');
            for (let i = 0; i < posts.length; i++) {
                let postId = i + 1;

                // If post is not a job url, skip it
                if (!posts[i].querySelector('a')) {
                    this.ERRORS.push({
                        Id: postId,
                        message: 'Post has no title'
                    });
                }

                var postViewJobUrl = posts[i].querySelector('a').attributes.href.value;

                if (!posts[i].querySelector('h3')) {
                    this.ERRORS.push({
                        Id: postId,
                        message: 'Post has no title'
                    });
                }

                var postTitle = posts[i].querySelector('h3').textContent;
                var postCreatedAt = posts[i].querySelector('span:nth-child(1)').textContent;
                // Get the job detail
                let data = await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.Axios.get(postViewJobUrl)
                            .then((response) => {
                                    console.log("Post ID: " + postId);
                                    if (response && response.status === 200) {
                                        const contentHtml = new JSDOM(response.data);

                                        // Job Referemce is required
                                        let jobReference = contentHtml.window.document.querySelector('div.candidate_working_widget > div:nth-child(12) > p:nth-child(2)');
                                        if (jobReference) {
                                            jobReference = jobReference.textContent.trim();
                                        } else {
                                            this.ERRORS.push({
                                                Id: postId,
                                                message: 'Post has no job reference'
                                            });
                                        }

                                        contentHtml.window.document.querySelector('div.candidate_about_info > h4').remove();
                                        // Job title
                                        let jobTitle = Buffer.alloc(postTitle.length, postTitle, 'utf8').toString('base64');

                                        // Post created at: Formart date and convert to timestamp
                                        let jobCreatedAtArray = postCreatedAt.split(' ');
                                        if (jobCreatedAtArray[jobCreatedAtArray.length - 1] < 100) {
                                            postCreatedAt = postCreatedAt.replace(jobCreatedAtArray[jobCreatedAtArray.length - 1], '20' + jobCreatedAtArray[jobCreatedAtArray.length - 1]);
                                        }

                                        postCreatedAt = new Date(postCreatedAt).getTime();

                                        // Job description
                                        let jobDescription = contentHtml.window.document.querySelector('div.candidate_about_info')
                                        if (jobDescription) {
                                            jobDescription = jobDescription.textContent;
                                            jobDescription = Buffer.alloc(jobDescription.length, jobDescription, 'utf8').toString('base64')
                                        } else {
                                            this.ERRORS.push({
                                                Id: postId,
                                                message: 'Post has no description'
                                            });
                                        }

                                        let jobModel = contentHtml.window.document.querySelector('div.candidate_about_info span:nth-child(5)');
                                        if (jobModel) {
                                            jobModel = jobModel.textContent;
                                            if (jobModel.includes('Hybrid') || jobModel.includes('(remote/in person)')) {
                                                jobModel = 'Hybrid';
                                            } else if (jobModel.includes('Full-Remote') || jobModel.includes('Full Remote')) {
                                                jobModel = 'Full Remote';
                                            } else if (jobModel.includes('In Person') || jobModel.includes('In-Person')) {
                                                jobModel = 'In Person';
                                            } else {
                                                jobModel = '-';
                                            }
                                        } else {
                                            jobModel = '-';
                                        }

                                        let jobApplyUrl = contentHtml.window.document.querySelector('div.job_buttons > button');
                                        if (jobApplyUrl) {
                                            jobApplyUrl = jobApplyUrl.attributes.onclick.value.replace('location.href = \'', '').replace('\';', '');
                                        } else {
                                            this.ERRORS.push({
                                                Id: postId,
                                                message: 'Post has no apply url'
                                            });
                                        }

                                        resolve({
                                            id: postId,
                                            date: postCreatedAt,
                                            title: jobTitle,
                                            jobref: jobReference,
                                            work_type: '-',
                                            work_model: jobModel,
                                            description: jobDescription,
                                            apply_url: jobApplyUrl,
                                            details_url: postViewJobUrl
                                        });
                                    }else{
                                        Mail.Send("ERROR", "Page not found url: " + postViewJobUrl);
                                    }
                                }
                            ).catch((err) => {
                            reject(err);
                            // Send email to admin and developer
                        });
                    }, 1500);
                });

                if (this.ERRORS.length <= 0) {
                    this.JOBS.push(data);
                }
            }
        }

        if (fs.existsSync(this.FILE.PATH)) {
            fs.unlinkSync(this.FILE.PATH);
        }

        fs.writeFileSync(this.FILE.PATH, JSON.stringify(this.JOBS));

        if (this.ERRORS.length > 0) {
            Mail.Send("Job Scrapper", "Job Scrapper Error: " + this.ERRORS);
        }

    })
    .catch((err) => {
        console.log(err);
    });
