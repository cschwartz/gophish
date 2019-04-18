/*
	tracked_attachments.js
	Handles the creation, editing, and deletion of tracked attachments
	Author: Christian Schwartz <github.com/cschwartz>
*/
var trackedAttachments = []
var icons = {
    "application/vnd.ms-excel": "fa-file-excel-o",
    "text/plain": "fa-file-text-o",
    "image/gif": "fa-file-image-o",
    "image/png": "fa-file-image-o",
    "application/pdf": "fa-file-pdf-o",
    "application/x-zip-compressed": "fa-file-archive-o",
    "application/x-gzip": "fa-file-archive-o",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "fa-file-powerpoint-o",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "fa-file-word-o",
    "application/octet-stream": "fa-file-o",
    "application/x-msdownload": "fa-file-o"
}

function attach() {
    var file = $("#content")[0].files[0]

    var reader = new FileReader();
    reader.onload = function (e) {
        $("#file-filename").text(file.name)
        $("#file-type").text(file.type)
        $("#file-download").prop("href", reader.result)
    }
    reader.onerror = function (e) {
        console.log(e)
    }
    reader.readAsDataURL(file)
}

function edit(idx) {
    $("#modalSubmit").unbind('click').click(function () {
        save(idx)
    })

    if (idx != -1) {
        trackedAttachment = trackedAttachments[idx]
        $("#name").val(trackedAttachment.name)
        $("#file-filename").text(trackedAttachment.filename)
        $("#file-type").text(trackedAttachment.type)
        $("#file-download").prop("href", "data:" + trackedAttachment.type + ";base64," + trackedAttachment.content)
    }
}

function save(idx) {
    var trackedAttachment = {
        name: $("#name").val(),
        filename: $("#file-filename").text(),
        type: $("#file-type").text(),
        content: $("#file-download").prop("href").split(",")[1]
    }

    if (idx != -1) {
        trackedAttachment.id = trackedAttachments[idx].id

        api.trackedAttachmentsId.put(trackedAttachment)
            .success(function (data) {
                successFlash("Tracked Attachment edited successfully!")
                load()
                dismiss()
            })
            .error(function (data) {
                modalError(data.responseJSON.message)
            })
    } else {
        api.trackedAttachments.post(trackedAttachment)
            .success(function (data) {
                successFlash("Tracked Attachment added successfully!")
                load()
                dismiss()
            })
            .error(function (data) {
                modalError(data.responseJSON.message)
            })
    }
}

function copy(idx) {
    $("#modalSubmit").unbind('click').click(function () {
        save(-1)
    })
    var trackedAttachment = trackedAttachments[idx]
    $("#name").val("Copy of " + trackedAttachment.name)
    $("#file-filename").text(trackedAttachment.filename)
    $("#file-type").text(trackedAttachment.type)
    $("#file-download").prop("href", "data:" + trackedAttachment.type + ";base64," + trackedAttachment.content)
}

var deleteTrackedAttachment = function (idx) {
    swal({
        title: "Are you sure?",
        text: "This will delete the Tracked Attachment. This can't be undone!",
        type: "warning",
        animation: false,
        showCancelButton: true,
        confirmButtonText: "Delete " + escapeHtml(trackedAttachments[idx].name),
        confirmButtonColor: "#428bca",
        reverseButtons: true,
        allowOutsideClick: false,
        preConfirm: function () {
            return new Promise(function (resolve, reject) {
                api.trackedAttachmentsId.delete(trackedAttachments[idx].id)
                    .success(function (msg) {
                        resolve()
                    })
                    .error(function (data) {
                        reject(data.responseJSON.message)
                    })
            })
        }
    }).then(function () {
        swal(
            'Tracked Attachment Deleted!',
            'This Tracked Attachment has been deleted!',
            'success'
        );
        $('button:contains("OK")').on('click', function () {
            location.reload()
        })
    })
}

function load() {
    /*
        load() - Loads the current tracked attachments using the API
    */
    $("#trackedAttachmentTable").hide()
    $("#emptyMessage").hide()
    $("#loading").show()
    api.trackedAttachments.get()
        .success(function (tas) {
            trackedAttachments = tas
            $("#loading").hide()
            if (trackedAttachments.length > 0) {
                $("#trackedAttachmentTable").show()
                trackedAttachmentsTable = $("#trackedAttachmentTable").DataTable({
                    destroy: true,
                    columnDefs: [{
                        orderable: false,
                        targets: "no-sort"
                    }]
                });
                trackedAttachmentsTable.clear()
                $.each(trackedAttachments, function (i, trackedAttachment) {
                    var icon = icons[trackedAttachment.type] || "fa-file-o"

                    trackedAttachmentsTable.row.add([
                        escapeHtml(trackedAttachment.name),
                        '<i class="fa ' + icon + '"></i>',
                        moment(trackedAttachment.modified_date).format('MMMM Do YYYY, h:mm:ss a'),
                        "<div class='pull-right'><span data-toggle='modal' data-backdrop='static' data-target='#modal'><button class='btn btn-primary' data-toggle='tooltip' data-placement='left' title='Edit Tracked Attachment' onclick='edit(" + i + ")'>\
                            <i class='fa fa-pencil'></i>\
                            </button></span>\
                    <span data-toggle='modal' data-target='#modal'><button class='btn btn-primary' data-toggle='tooltip' data-placement='left' title='Copy Tracked Attachment' onclick='copy(" + i + ")'>\
                            <i class='fa fa-copy'></i>\
                            </button></span>\
                            <button class='btn btn-danger' data-toggle='tooltip' data-placement='left' title='Delete Tracked Attachment' onclick='deleteTrackedAttachment(" + i + ")'>\
                            <i class='fa fa-trash-o'></i>\
                            </button></div>"
                    ]).draw()
                })
                $('[data-toggle="tooltip"]').tooltip()
            } else {
                $("#emptyMessage").show()
            }
        })
        .error(function () {
            $("#loading").hide()
            errorFlash("Error fetching tracked attachments")
        })
}

function dismiss() {
    $("#modal\\.flashes").empty()
    $("#name").val("")
    $("#file-filename").text("")
    $("#file-type").text("")
    $("#file-download").prop("href", "#")
    $("#name").val("")
    $("#modal").modal('hide')
}

$(document).ready(function () {
    // Setup multiple modals
    // Code based on http://miles-by-motorcycle.com/static/bootstrap-modal/index.html
    $('.modal').on('hidden.bs.modal', function (event) {
        $(this).removeClass('fv-modal-stack');
        $('body').data('fv_open_modals', $('body').data('fv_open_modals') - 1);
    });
    $('.modal').on('shown.bs.modal', function (event) {
        // Keep track of the number of open modals
        if (typeof ($('body').data('fv_open_modals')) == 'undefined') {
            $('body').data('fv_open_modals', 0);
        }
        // if the z-index of this modal has been set, ignore.
        if ($(this).hasClass('fv-modal-stack')) {
            return;
        }
        $(this).addClass('fv-modal-stack');
        // Increment the number of open modals
        $('body').data('fv_open_modals', $('body').data('fv_open_modals') + 1);
        // Setup the appropriate z-index
        $(this).css('z-index', 1040 + (10 * $('body').data('fv_open_modals')));
        $('.modal-backdrop').not('.fv-modal-stack').css('z-index', 1039 + (10 * $('body').data('fv_open_modals')));
        $('.modal-backdrop').not('fv-modal-stack').addClass('fv-modal-stack');
    });
    $.fn.modal.Constructor.prototype.enforceFocus = function () {
        $(document)
            .off('focusin.bs.modal') // guard against infinite focus loop
            .on('focusin.bs.modal', $.proxy(function (e) {
                if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
                    this.$element.trigger('focus');
                }
            }, this));
    };
    // Scrollbar fix - https://stackoverflow.com/questions/19305821/multiple-modals-overlay
    $(document).on('hidden.bs.modal', '.modal', function () {
        $('.modal:visible').length && $(document.body).addClass('modal-open');
    });
    $('#modal').on('hidden.bs.modal', function (event) {
        dismiss()
    });

    load()
})